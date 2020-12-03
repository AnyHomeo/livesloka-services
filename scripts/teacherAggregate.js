const mongoose = require("mongoose");
const Teacher = require("../models/Teacher.model");
mongoose.connect(
  "mongodb+srv://kamal:kamal@cluster0.wa7m8.mongodb.net/livekumon-dev?retryWrites=true&w=majority",
  { useUnifiedTopology: true, useNewUrlParser: true },
  (err) => {
    if (!err) {
      console.log("MongoDB connection succeeded.");
    } else {
      console.log(
        "Error in MongoDB connection : " + JSON.stringify(err, undefined, 2)
      );
    }
  }
);

Teacher.aggregate()
  .lookup({
    _id: "$category",
  })
  .then((data) => {
    console.log(data);
  })
  .catch((Err) => console.log(Err));
