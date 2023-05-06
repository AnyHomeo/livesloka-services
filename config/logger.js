exports.logError = (error, method) => {
  console.error(
    `Error in ${method}` || 'ERROR',
    '------>',
    JSON.stringify({ error })
  );
};
