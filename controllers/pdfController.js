import fs from "fs";
import path from "path";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";
import Student from "../models/Student.js";
import Standard from "../models/Standard.js";
import { getBrowser } from "../utils/browser.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to compare and sort standards: "બાલ મંદિર" first, then Std 1, 2, 3, ..., 10
export const compareStandards = (stdA = "", stdB = "", standardOrderMap = {}) => {
  const a = String(stdA).trim();
  const b = String(stdB).trim();

  // 1. If explicit order exists from database Standard collection
  if (standardOrderMap[a] !== undefined && standardOrderMap[b] !== undefined) {
    return standardOrderMap[a] - standardOrderMap[b];
  }

  // 2. Bal Mandir / KG should always come first
  const isBalA = /બાલ|bal|kg|nursery/i.test(a);
  const isBalB = /બાલ|bal|kg|nursery/i.test(b);
  if (isBalA && !isBalB) return -1;
  if (!isBalA && isBalB) return 1;

  // 3. Extract numbers from standards (e.g. "ધોરણ 1" -> 1, "ધોરણ 10" -> 10)
  const numA = parseInt(a.replace(/\D/g, ""), 10);
  const numB = parseInt(b.replace(/\D/g, ""), 10);

  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA !== numB) return numA - numB;
  } else if (!isNaN(numA)) {
    return -1;
  } else if (!isNaN(numB)) {
    return 1;
  }

  return a.localeCompare(b, "gu-IN", { numeric: true });
};

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

    const [testsRaw, dbStandards] = await Promise.all([
      Test.find({
        testDate: { $gte: start, $lte: end },
        isGuest: req.user.role === "guest",
      }),
      Standard.find().sort({ order: 1, createdAt: 1 }),
    ]);

    if (!testsRaw.length) {
      return res.status(400).json({ message: "No tests found for this date" });
    }

    const standardOrderMap = {};
    dbStandards.forEach((s, idx) => {
      standardOrderMap[s.name] = s.order !== undefined ? s.order : idx;
    });

    // 🎯 Sort tests standard-wise: Bal Mandir -> Std 1 -> Std 2 ... -> Std 10
    const tests = testsRaw.sort((t1, t2) =>
      compareStandards(t1.standard, t2.standard, standardOrderMap)
    );

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
      const classStudents = students.filter(
        (s) => s.standard === test.standard
      );

      let tableRowsHTML = "";

      classStudents.forEach((student, index) => {
        const mark = marks.find(
          (m) =>
            m.studentId?._id?.toString() === student._id.toString() &&
            m.testId.toString() === test._id.toString()
        );

        const isAbsent = mark?.status === "ABSENT";
        const marksText = mark
          ? isAbsent
            ? `<span class="absent-text">ગેરહાજર</span>`
            : `<span class="marks-val">${mark.obtainedMarks} / ${mark.totalMarks}</span>`
          : "—";

        const subjectText = mark?.subject || "-";

        tableRowsHTML += `
          <tr class="${isAbsent ? "absent-row" : ""}">
            <td class="center" style="width: 45px;">
              <span class="roll-badge">${index + 1}</span>
            </td>
            <td>
              <span class="student-name">${student.name}</span>
            </td>
            <td>
              <span class="subject-badge">${subjectText}</span>
            </td>
            <td class="center">
              ${marksText}
            </td>
          </tr>
        `;
      });

      contentHTML += `
        <div class="class-section">
          <div class="class-header">
            <div class="class-title">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:rgba(255,255,255,0.18); border-radius:6px; margin-right:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                  <path d="M6 6h10"></path>
                  <path d="M6 10h10"></path>
                </svg>
              </span>
              <span>${test.standard}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="center" style="width: 45px;">ક્રમ</th>
                <th>વિદ્યાર્થી નું નામ</th>
                <th>વિષય</th>
                <th class="center">માર્ક્સ</th>
              </tr>
            </thead>
            <tbody>
              ${
                tableRowsHTML ||
                `<tr><td colspan="4" class="center" style="padding: 12px; color: #94a3b8;">આ ધોરણ માટે કોઈ વિદ્યાર્થી મળ્યા નથી</td></tr>`
              }
            </tbody>
          </table>
        </div>
      `;
    });

    // Always read latest template from disk
    const templatePath = path.join(
      __dirname,
      "../templates/classWiseReport.html"
    );
    let html = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, "utf-8")
      : cachedTemplate;

    const formattedTestDate = new Date(testDate).toLocaleDateString("gu-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    html = html
      .replace("{{GUJARATI_FONT}}", gujaratiFont)
      .replace("{{CONTENT}}", contentHTML)
      .replace("{{SCHOOL_NAME}}", "જય માતાજી ટ્યુશન ક્લાસીસ")
      .replace("{{TEST_DATE}}", `${formattedTestDate}`)
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
          font-size:10px;
          color:#64748b;
          padding: 0 10mm;
          display:flex;
          justify-content:flex-end;
          align-items:center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div>
            Page <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>
      `,
      margin: {
        top: "14mm",
        bottom: "16mm",
        left: "10mm",
        right: "10mm",
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
