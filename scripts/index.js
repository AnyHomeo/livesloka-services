const moment = require('moment');

exports.addMonths = (date, months) => {
  date = new Date(moment(date, 'DD-MM-YYYY').format());
  var d = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== d) {
    date.setDate(0);
  }
  return moment(date).format('DD-MM-YYYY');
};

exports.capitalize = (word) => {
  return word.charAt(0).toUpperCase() + word.substring(1);
};
