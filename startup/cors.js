const cors = require("cors");
const cookieParser = require("cookie-parser");

module.exports = function (app) {
  app.use(
    cors({
      exposedHeaders: ["x-auth-token", "Set-Cookie"],
      credentials: true,
      allowedHeaders: ["Content-Type", "x-auth-token"],
    })
  );

  app.use(cookieParser());
};
