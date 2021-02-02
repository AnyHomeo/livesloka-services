const equal = require("fast-deep-equal");
let arr1 = ["MONDAY-123", "MONDAY-125534"].sort();
let arr2 = ["MONDAY-125534", "MONDAY-123"].sort();

console.log(equal(arr1, arr2));
