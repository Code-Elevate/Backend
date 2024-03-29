const express = require("express");

const register = require("../routes/register");

const error = require("../middleware/error");

module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/register", register);
  app.use(error);
};
