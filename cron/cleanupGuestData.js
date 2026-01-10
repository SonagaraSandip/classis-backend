import cron from "node-cron";
import Student from "../models/Student.js";
import Test from "../models/Test.js";
import Mark from "../models/Mark.js";

export const startGuestCleanupCron = () => {
  //Runs every hours (safe + lighweight)
  cron.schedule("0 * * * *", async () => {
    try {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      const studentResult = await Student.deleteMany({
        isGuest: true,
        createdAt: { $lt: twelveHoursAgo },
      });
      const testResult = await Test.deleteMany({
        isGuest: true,
        createdAt: { $lt: twelveHoursAgo },
      });
      const markResults = await Mark.deleteMany({
        isGuest: true,
        createdAt: { $lt: twelveHoursAgo },
      });

      console.log("Guest clenup Done : ", {
        students: studentResult.deletedCount,
        tests: testResult.deletedCount,
        marks: markResults.deletedCount,
      });
    } catch (err) {
      console.error("Guest clenup failed : ", err.message);
    }
  });
};
