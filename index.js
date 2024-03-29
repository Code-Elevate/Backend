const express = require("express");

const app = express();

app.get("/", (_, res) =>
  res.status(200).send({ message: "Welcome to CodeElevate API" })
);

require("./startup/config");
require("./startup/cors")(app);
require("./startup/db")();
require("./startup/routes")(app);

const server = app.listen(process.env.PORT || 8080, () =>
  console.log(`Listening on port ${process.env.PORT || 8080}...`)
);

module.exports = server;
