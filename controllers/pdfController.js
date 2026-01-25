import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";
import Student from "../models/Student.js";
import { fileURLToPath } from "url";

const imageToBase64 = (filePath) =>
  `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateClassWisePDF = async (req, res) => {
  try {
    const { testDate } = req.query;

    const fileName = `Marks_${testDate}.pdf`;

    if (!testDate) {
      return res.status(400).json({ message: "testDate required" });
    }

    const tests = await Test.find({
      testDate: new Date(testDate),
      isGuest: req.user.role == "guest",
    });

    if (!tests.length) {
      return res.status(400).json({ message: "No tests Found" });
    }

    const testIds = tests.map((t) => t._id);

    const marks = await Mark.find({
      testId: { $in: testIds },
      isGuest: req.user.role === "guest",
    }).populate("studentId", "name standard");

    const students = await Student.find({ isGuest: req.user.role === "guest" });
    // buikld html content
    let contentHTML = "";

    tests.forEach((test, index) => {
      contentHTML += `<h2>${test.standard}</h2>`;
      contentHTML += `
        <table>
          <thead>
            <tr>
              <th>વિદ્યાર્થી નું નામ</th>
              <th>વિષય</th>
              <th>માર્ક્સ</th>
            </tr>
          </thead>
          <tbody>
      `;

      const classStudents = students.filter(
        (s) => s.standard === test.standard,
      );

      classStudents.forEach((student) => {
        const mark = marks.find(
          (m) =>
            m.studentId._id.toString() === student._id.toString() &&
            m.testId.toString() === test._id.toString(),
        );

        const isAbsent = mark?.status === "ABSENT";

        const marksText = mark
          ? mark.status === "ABSENT"
            ? "ABSENT"
            : `${mark.obtainedMarks} / ${mark.totalMarks}`
          : "-";

        contentHTML += `
          <tr class="${isAbsent ? "absent-row" : ""}">
            <td>${student.name}</td>
            <td>${mark?.subject || "-"}</td>
            <td class="${isAbsent ? "absent-text" : ""}">
    ${marksText}
  </td>
          </tr>
        `;
      });

      contentHTML += `</tbody></table>`;

      // page break except last
      // if (index !== tests.length - 1) {
      //   contentHTML += `<div class="page-break"></div>`;
      // }
    });

    // 3️⃣ Load HTML template
    const templatePath = path.join(
      __dirname,
      "../templates/classWiseReport.html",
    );

    const logoPath = imageToBase64(path.join(__dirname, "../assets/logo.png"));
    const watermarkPath = imageToBase64(
      path.join(__dirname, "../assets/watermark.png"),
    );

    let html = fs.readFileSync(templatePath, "utf-8");
    html = html
      .replace("{{CONTENT}}", contentHTML)
      .replace("{{SCHOOL_NAME}}", "જય માતાજી ટ્યુશન ક્લાસીસ")
      .replace("{{TEST_DATE}}", new Date(testDate).toLocaleDateString("gu-IN"))
      .replace("{{SCHOOL_LOGO}}", logoPath)
      .replace("{{WATERMARK_LOGO}}", watermarkPath);

    // 4️⃣ Puppeteer PDF
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined ,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate: `
    <div></div>
  `,

      footerTemplate: `
    <div style="
      width:100%;
      font-size:12px;
      color:#444;
      padding: 0 20px;
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <div>જય માતાજી ટ્યુશન કલાસીસ</div>
      <div>
        Page <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    </div>
  `,

      margin: {
        top: "20mm",
        bottom: "30mm", // IMPORTANT: space for footer
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();

    // 5️⃣ Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Marks_${testDate}.pdf"; filename*=UTF-8''Marks_${testDate}.pdf`,
    );

    res.send(pdf);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "PDF generation failed", error: err.message });
  }
};
