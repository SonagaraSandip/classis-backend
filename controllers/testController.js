import Test from "../models/Test.js";
import Mark from "../models/Mark.js";

export const createTest = async (req, res) => {
  try {
    // console.log("REQ BODY:", req.body); // 🔍 debug once

    const { standard, testDate } = req.body;

    if (!standard || !testDate) {
      return res.status(400).json({ message: "All fields required" });
    }

    const start = new Date(testDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(testDate);
    end.setHours(23, 59, 59, 999);

    // prevent duplicate test session for same class + date
    const existing = await Test.findOne({
      standard,
      testDate: {
        $gte: start,
        $lte: end,
      },
      isGuest: req.user?.role === "guest",
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const test = await Test.create({
      standard,
      testDate,
      isGuest: req.user?.role === "guest",
    });

    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRecentTestHistory = async (req, res) => {
  try {
    const isGuest = req.user?.role === "guest";
    const limit = parseInt(req.query.limit) || 3;

    // Fetch tests sorted by testDate descending
    const tests = await Test.find({ isGuest }).sort({
      testDate: -1,
      createdAt: -1,
    });

    if (!tests || tests.length === 0) {
      return res.json([]);
    }

    const formatDateStr = (d) => {
      const dt = new Date(d);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Group tests by date string
    const dateMap = new Map();
    for (const test of tests) {
      const dateKey = formatDateStr(test.testDate);
      if (!dateMap.has(dateKey)) {
        if (dateMap.size >= limit) {
          continue;
        }
        dateMap.set(dateKey, {
          testDate: dateKey,
          rawDate: test.testDate,
          tests: [],
          testIds: [],
          standards: new Set(),
        });
      }
      const entry = dateMap.get(dateKey);
      entry.tests.push(test);
      entry.testIds.push(test._id);
      if (test.standard) {
        entry.standards.add(test.standard);
      }
    }

    const recentDates = Array.from(dateMap.values());
    const allRecentTestIds = recentDates.flatMap((d) => d.testIds);

    // Fetch marks for these tests
    const marks = await Mark.find({
      testId: { $in: allRecentTestIds },
      isGuest,
    }).populate("studentId", "name standard");

    // Compute stats for each date
    const history = recentDates.map((group) => {
      const groupMarks = marks.filter((m) =>
        group.testIds.some(
          (tId) => tId.toString() === (m.testId?._id || m.testId).toString()
        )
      );

      const subjectsSet = new Set();
      let presentCount = 0;
      let absentCount = 0;

      groupMarks.forEach((m) => {
        if (m.subject) subjectsSet.add(m.subject);
        if (m.status === "ABSENT") {
          absentCount++;
        } else {
          presentCount++;
        }
      });

      return {
        testDate: group.testDate,
        rawDate: group.rawDate,
        standards: Array.from(group.standards),
        totalTests: group.tests.length,
        totalEntries: groupMarks.length,
        presentCount,
        absentCount,
        subjects: Array.from(subjectsSet),
      };
    });

    res.json(history);
  } catch (err) {
    console.error("Recent tests history error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch test history", error: err.message });
  }
};
