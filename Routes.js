const indexRouter = require("./routes/admin");
const customerRouter = require("./routes/customer");
const attendanceRouter = require("./routes/attendance");
const settingsRouter = require("./routes/settings");
const teacherRouter = require("./routes/teacher");
const scheduleRouter = require("./routes/schedule");
const paymentRouter = require("./routes/payment");
const zoomlink = require("./routes/zoomlink");
const salaryRouter = require("./routes/salary");
const uploadRouter = require("./routes/uploads");
const cancelClassRouter = require("./routes/cancelledClasses");
const classHistoryRouter = require("./routes/classHistory");
const summerCampRouter = require("./routes/summerCamp");
const careersRouter = require("./routes/careersApplications");
const teacherLeavesRouter = require("./routes/teacherLeaves");
const adMessagesRouter = require("./routes/adMessage");
const allocateRouter = require("./routes/AgentsAssignmentsToClass");
const extraAmountsRouter = require("./routes/extraAmounts");
const agentsRouter = require("./routes/agents");
const finalizedSalariesRouter = require("./routes/finalizedSalaries");
const transactionsRouter = require("./routes/transactions");
const expensesRouter = require("./routes/expenses");
const optionsRouter = require("./routes/options");
const scriptsRouter = require("./routes/scripts");
const subscriptionsRouter = require("./routes/subscriptions");
const mobileCustomerApiRouter = require("./routes/customers");
const videosRouter = require("./routes/videos");
const mobileTeachersApiRouter = require("./routes/mobileTeacher");
const chat = require("./routes/chat");
const nonchat = require("./routes/nonchat");
const group = require("./routes/group");
const plansRouter = require("./routes/plan");
const productsRouter = require("./routes/product");
const paymentsRouter = require("./routes/payments");
const reviews = require("./routes/Reviews");
const rewardsRouter = require("./routes/rewards");
const rolesRouter = require("./routes/roles");
const invoicesRouter = require("./routes/invoices");
const watiMessagesRouter = require("./routes/wati");
const { detectIntent } = require("./dialogflow");

module.exports = (app) => {
  app.post("/dialogflow", async (req, res) => {
    try {
      const { languageCode, queryText, sessionId } = req.body;
      let responseData = await detectIntent(languageCode, queryText, sessionId);
      res.send(responseData.response);
    } catch (error) {
      console.log(error);
      return res.send({ success: false });
    }
  });

  app.post("/api/webhook/zapier", (req, res) => {
    console.log(JSON.stringify(req.body, null, 2), req.query);
    return res.status(200).send({ success: true });
  });

  app.use("/", indexRouter);
  app.use("/", customerRouter);
  app.use("/", attendanceRouter);
  app.use("/", chat);
  app.use("/", nonchat);
  app.use("/", group);
  app.use("/messages", adMessagesRouter);
  app.use("/summercamps", summerCampRouter);
  app.use("/careers", careersRouter);
  app.use("/class-history", classHistoryRouter);
  app.use("/cancelclass", cancelClassRouter);
  app.use("/teacher-leaves", teacherLeavesRouter);
  app.use("/settings", settingsRouter);
  app.use("/teacher", teacherRouter);
  app.use("/schedule", scheduleRouter);
  app.use("/payment", paymentRouter);
  app.use("/link", zoomlink);
  app.use("/salary", salaryRouter);
  app.use("/uploads", uploadRouter);
  app.use("/allocate", allocateRouter);
  app.use("/extra", extraAmountsRouter);
  app.use("/agent", agentsRouter);
  app.use("/finalize", finalizedSalariesRouter);
  app.use("/transactions", transactionsRouter);
  app.use("/expenses", expensesRouter);
  app.use("/scripts", scriptsRouter);
  app.use("/subscriptions", subscriptionsRouter);
  app.use("/options", optionsRouter);
  app.use("/videos", videosRouter);
  app.use("/products", productsRouter);
  app.use("/plans", plansRouter);
  app.use("/payments", paymentsRouter);
  app.use("/reviews", reviews);
  app.use("/rewards", rewardsRouter);
  app.use("/roles", rolesRouter);
  app.use("/invoices", invoicesRouter);

  //mobile routes
  app.use("/api/customers", mobileCustomerApiRouter);
  app.use("/api/teachers", mobileTeachersApiRouter);
  app.use("/api/wati", watiMessagesRouter);
};
