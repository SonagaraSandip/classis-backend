import fs from "fs";
import path from "path";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";
import Student from "../models/Student.js";
import { getBrowser } from "../utils/browser.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to convert file to base64
const fileToBase64 = (filePath, mimeType) => {
  try {
    if (fs.existsSync(filePath)) {
      return `data:${mimeType};base64,${fs.readFileSync(filePath).toString("base64")}`;
    }
  } catch (err) {
    console.error(`Failed to load asset: ${filePath}`, err);
  }
  return "";
};

// ⚡ Cache static assets and HTML template at startup to avoid repeated disk reads
const gujaratiFont = fileToBase64(
  path.join(__dirname, "../assets/fonts/NotoSansGujarati-Regular.ttf"),
  "font/ttf"
);

const logoPath = fileToBase64(
  path.join(__dirname, "../assets/logo.png"),
  "image/png"
);

const watermarkPath = fileToBase64(
  path.join(__dirname, "../assets/watermark.png"),
  "image/png"
);

let cachedTemplate = "";
try {
  const templatePath = path.join(__dirname, "../templates/classWiseReport.html");
  if (fs.existsSync(templatePath)) {
    cachedTemplate = fs.readFileSync(templatePath, "utf-8");
  }
} catch (err) {
  console.error("Failed to cache HTML template:", err);
}

export const generateClassWisePDF = async (req, res) => {
  let page = null;
  try {
    const { testDate } = req.query;

    if (!testDate) {
      return res.status(400).json({ message: "testDate required" });
    }

    // 🎯 Use date range to avoid timezone mismatch
    const start = new Date(testDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(testDate);
    end.setHours(23, 59, 59, 999);

    const tests = await Test.find({
      testDate: { $gte: start, $lte: end },
      isGuest: req.user.role === "guest",
    }).sort({ standard: 1 });

    if (!tests.length) {
      return res.status(400).json({ message: "No tests found for this date" });
    }

    const testIds = tests.map((t) => t._id);

    const [marks, students] = await Promise.all([
      Mark.find({
        testId: { $in: testIds },
        isGuest: req.user.role === "guest",
      }).populate("studentId", "name standard"),
      Student.find({ isGuest: req.user.role === "guest" }).sort({ name: 1 }),
    ]);

    // Build HTML content
    let contentHTML = "";

    tests.forEach((test) => {
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
        (s) => s.standard === test.standard
      );

      classStudents.forEach((student) => {
        const mark = marks.find(
          (m) =>
            m.studentId?._id?.toString() === student._id.toString() &&
            m.testId.toString() === test._id.toString()
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
    });

    // Populate template from cached string
    let html = cachedTemplate || "";
    if (!html) {
      const templatePath = path.join(
        __dirname,
        "../templates/classWiseReport.html"
      );
      html = fs.readFileSync(templatePath, "utf-8");
    }

    html = html
      .replace("{{GUJARATI_FONT}}", gujaratiFont)
      .replace("{{CONTENT}}", contentHTML)
      .replace("{{SCHOOL_NAME}}", "જય માતાજી ટ્યુશન ક્લાસીસ")
      .replace("{{TEST_DATE}}", new Date(testDate).toLocaleDateString("gu-IN"))
      .replace("{{SCHOOL_LOGO}}", logoPath)
      .replace("{{WATERMARK_LOGO}}", watermarkPath);

    // Puppeteer PDF generation
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
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
          <div>જય માતાજી ટ્યુશન ક્લાસીસ</div>
          <div>
            Page <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>
      `,
      margin: {
        top: "20mm",
        bottom: "30mm",
        left: "15mm",
        right: "15mm",
      },
    });

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Marks_${testDate}.pdf"; filename*=UTF-8''Marks_${testDate}.pdf`
    );

    res.send(pdf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res
      .status(500)
      .json({ message: "PDF generation failed", error: err.message });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeErr) {
        console.error("Failed to close puppeteer page:", closeErr);
      }
    }
  }
};
