const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://6fqHWBUpkD2bvrxY:6fqHWBUpkD2bvrxY@Global-Testing.oqgrq.mongodb.net/global-testing?retryWrites=true&w=majority",
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
