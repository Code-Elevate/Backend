const mongoose = require("mongoose");

module.exports = function () {
  mongoose.connect(process.env.DB_URL, {
    dbName:
      process.env.NODE_ENV === "development"
        ? process.env.DEV_DB_NAME
        : process.env.PROD_DB_NAME,
  });

  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function () {
    console.log(`Connected to MongoDB ${db.name}...`);
  });
};
