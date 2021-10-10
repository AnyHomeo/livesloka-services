module.exports = (app) => {
  const indexRouter = require('./routes/admin');
  const customerRouter = require('./routes/customer');
  const attendanceRouter = require('./routes/attendance');
  const settingsRouter = require('./routes/settings');
  const teacherRouter = require('./routes/teacher');
  const scheduleRouter = require('./routes/schedule');
  const paymentRouter = require('./routes/payment');
  const zoomlink = require('./routes/zoomlink');
  const salaryRouter = require('./routes/salary');
  const uploadRouter = require('./routes/uploads');
  const cancelClassRouter = require('./routes/cancelledClasses');
  const classHistoryRouter = require('./routes/classHistory');
  const summerCampRouter = require('./routes/summerCamp');
  const CareersRouter = require('./routes/careersApplications');
  const teacherLeavesRouter = require('./routes/teacherLeaves');
  const AdMessagesRouter = require('./routes/adMessage');
  const allocateRouter = require('./routes/AgentsAssignmentsToClass');
  const extraAmountsRouter = require('./routes/extraAmounts');
  const agentsRouter = require('./routes/agents');
  const finalizedSalariesRouter = require('./routes/finalizedSalaries');
  const transactionsRouter = require('./routes/transactions');
  const expensesRouter = require('./routes/expenses');
  const optionsRouter = require('./routes/options');
  const scriptsRouter = require('./routes/scripts');
  const subscriptionsRouter = require('./routes/subscriptions');
  const MobileCustomerApiRouter = require('./routes/customers');
  const videosRouter = require('./routes/videos');
  const MobileTeachersApiRouter = require('./routes/mobileTeacher');
  const chat = require('./routes/chat');
  const group = require('./routes/group');
  const plansRouter = require('./routes/plan')
  const productsRouter = require('./routes/product')

  app.use('/', indexRouter);
  app.use('/', customerRouter);
  app.use('/', attendanceRouter);
  app.use('/', chat);
  app.use('/', group);
  app.use('/messages', AdMessagesRouter);
  app.use('/summercamps', summerCampRouter);
  app.use('/careers', CareersRouter);
  app.use('/class-history', classHistoryRouter);
  app.use('/cancelclass', cancelClassRouter);
  app.use('/teacher-leaves', teacherLeavesRouter);
  app.use('/settings', settingsRouter);
  app.use('/teacher', teacherRouter);
  app.use('/schedule', scheduleRouter);
  app.use('/payment', paymentRouter);
  app.use('/link', zoomlink);
  app.use('/salary', salaryRouter);
  app.use('/uploads', uploadRouter);
  app.use('/allocate', allocateRouter);
  app.use('/extra', extraAmountsRouter);
  app.use('/agent', agentsRouter);
  app.use('/finalize', finalizedSalariesRouter);
  app.use('/transactions', transactionsRouter);
  app.use('/expenses', expensesRouter);
  app.use('/scripts', scriptsRouter);
  app.use('/subscriptions', subscriptionsRouter);
  app.use('/options', optionsRouter);
  app.use('/videos', videosRouter);
  app.use('/products', productsRouter);
  app.use('/plans',plansRouter);

  //mobile routes
  app.use('/api/customers', MobileCustomerApiRouter);
  app.use('/api/teachers', MobileTeachersApiRouter);
};
