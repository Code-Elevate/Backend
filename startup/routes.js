const express = require("express");

const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optional_auth");
const error = require("../middleware/error");

const usersRoutes = () => {
  const register = require("../routes/users/register");
  const login = require("../routes/users/login");
  const details = require("../routes/users/details");
  const history = require("../routes/users/history");
  const search = require("../routes/users/search");

  const router = express.Router();

  router.use("/register", register);
  router.use("/login", login);
  router.use("/details", auth, details);
  router.use("/history", auth, history);
  router.use("/search", search);

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
  const register = require("../routes/contests/register");
  const leaderboard = require("../routes/contests/leaderboard");

  const router = express.Router();

  router.use("/", optionalAuth, contests);
  router.use("/:contestId/register", auth, register);
  router.use("/:contestId/leaderboard", leaderboard);

  return router;
};

const problemsRoutes = () => {
  const problems = require("../routes/problems");
  const execute = require("../routes/problems/execute");
  const submissions = require("../routes/problems/submissions");

  const router = express.Router();

  router.use("/", optionalAuth, problems);
  router.use("/:problemId", execute);
  router.use("/:problemId/submissions", submissions);

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
