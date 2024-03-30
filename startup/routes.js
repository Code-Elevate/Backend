const express = require("express");

const auth = require("../middleware/auth");
const error = require("../middleware/error");

const usersRoutes = () => {
  const register = require("../routes/users/register");
  const login = require("../routes/users/login");

  const router = express.Router();

  router.use("/register", register);
  router.use("/login", login);

  return router;
};

const manageRoutes = () => {
  const contests = require("../routes/manage/contests");
  const problems = require("../routes/manage/problems");

  const router = express.Router();

  router.use("/contests", contests);
  router.use("/contests/:contestId/problems", problems);

  return router;
};

const contestsRoutes = () => {
  const contests = require("../routes/contests");

  const router = express.Router();

  router.use("/", contests);

  return router;
};

const problemsRoutes = () => {
  const problems = require("../routes/problems");

  const router = express.Router();

  router.use("/", problems);

  return router;
};

module.exports = function (app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/users", usersRoutes());
  app.use("/manage", auth, manageRoutes());
  app.use("/contests", contestsRoutes());
  app.use("/problems", problemsRoutes());
  app.use(error);
};
