require("dotenv").config();
const assert = require("assert");

module.exports = function () {
  assert(process.env.DB_URL, "FATAL ERROR: DB_URL is not defined.");
  assert(process.env.ENGINE_URL, "FATAL ERROR: ENGINE_URL is not defined.");
  assert(
    process.env.JWT_PRIVATE_KEY,
    "FATAL ERROR: JWT_PRIVATE_KEY is not defined."
  );
};
