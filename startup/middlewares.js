const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

module.exports = function (app) {
  app.use(
    cors({
      exposedHeaders: ["x-auth-token", "Set-Cookie"],
      credentials: true,
      allowedHeaders: ["Content-Type", "x-auth-token"],
    })
  );

  app.use(cookieParser());
  app.use(compression());
};
