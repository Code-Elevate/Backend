const express = require("express");

const app = express();

app.get("/", (_, res) => {
  res.status(200).sendFile("index.html", { root: __dirname });
});

require("./startup/config")();
require("./startup/cors")(app);
require("./startup/db")();
require("./startup/routes")(app);

const server = app.listen(process.env.PORT || 8080, () =>
  console.log(`Listening on port ${process.env.PORT || 8080}...`)
);

module.exports = server;
