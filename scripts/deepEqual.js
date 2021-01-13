var equal = require("fast-deep-equal/es6");
console.log(
  equal(
    {
      wednesday: ["WEDNESDAY-12:30 AM-01:00 AM"],
      tuesday: ["TUESDAY-12:30 AM-01:00 AM"],
      monday: ["MONDAY-12:30 AM-01:00 AM"],
    },
    {
      monday: ["MONDAY-12:30 AM-01:00 AM"],
      tuesday: ["TUESDAY-12:30 AM-01:00 AM"],
      wednesday: ["WEDNESDAY-12:30 AM-01:00 AM"],
    }
  )
);
