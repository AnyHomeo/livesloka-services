const express = require("express");
const router = express.Router();

const {
  getAttendance,
  postAttendance,
  getAllAttendanceByScheduleIdAndDate,
  getAttendanceByScheduleId,
  getAttendanceWithPayments
} = require("../controllers/attendance.controller");

/**
 *@swagger
 * tags:
 *   name: Attendance
 *   description: Apis to manage Customer Attendance
 */


/**
 * @swagger
 *  /admin/attendance/{customerId}:
 *  get:
 *   parameters:
 *    - in: path
 *      name: customerId
 *   summary: get attendance details of a customer
 *   tags: [Attendance]
 *   responses:
 *    200:
 *     description: Retrieved attendance details Successfully
 *    500:
 *     description: Something went wrong!
 */

router.get("/admin/attendance/:id", getAttendance);

/**
 * @swagger
 *  /attendance:
 *  post: 
 *   summary: Post attendance of a class
 *   tags: [Attendance]
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       properties:
 *        scheduleId:
 *         type: string
 *         example: 5fbff25f4a16300017a45696
 *        date:
 *         type: string
 *         example: 2021-02-04
 *         description: Date in YYYY-MM-DD format
 *        customers:
 *         type: array
 *         example: ["5fbff25f4a16300017a45696"]
 *         description: Array of customer Ids who are present in class
 *        requestedStudents:
 *         type: array
 *         example: ["5fbff25f4a16300017a45696"]
 *         description: Array of customer Ids who are requested that they don't want to attend class
 *        absentees:
 *         type: array
 *         example: ["5fbff25f4a16300017a45696"]
 *         description: Array of customer Ids who are absent in class
 *        requestedPaidStudents:
 *         type: array
 *         example: ["5fbff25f4a16300017a45696"]
 *         description: Array of customer Ids who are requested that they don't want to attend class but paid to teacher
 *       required:
 *        - scheduleId
 *        - date
 *   responses:
 *    200:
 *     description: Attendance Successful
 *    400:
 *     description: Invalid UserId or Password
 *    500:
 *     description: Something went wrong!
 */
router.post("/attendance", postAttendance);


router.get("/attendance/:scheduleId", getAllAttendanceByScheduleIdAndDate);
router.get("/attendance/all/:scheduleId", getAttendanceByScheduleId);
router.get("/user/history/:email",getAttendanceWithPayments)
module.exports = router;