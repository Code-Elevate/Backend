const express = require("express");
const assert = require("assert");

const Problem = require("../../models/problem");
const Submission = require("../../models/submission");
const Team = require("../../models/team");
const auth = require("../../middleware/auth");

const router = express.Router({ mergeParams: true });

router.get("/", auth, async (req, res) => {
  const problem = await Problem.findById(req.params.problemId).populate(
    "contest"
  );
  assert(problem, "ERROR 404: Problem not found.");

  // Find the team of the user
  const team = await Team.findTeam(problem.contest._id, req.user._id);
  assert(team, "ERROR 404: Team not found.");

  const submissions = await Submission.find({
    problem: problem._id,
    team: team._id,
  }).sort({ time: -1 });

  res
    .status(200)
    .send(submissions.map((submission) => submission.toMiniJSON()));
});

router.get("/all", async (req, res) => {
  const problem = await Problem.findById(req.params.problemId).populate(
    "contest"
  );
  assert(problem, "ERROR 404: Problem not found.");

  const submissions = await Submission.find({
    problem: problem._id,
  }).sort({ time: -1 });

  res
    .status(200)
    .send(submissions.map((submission) => submission.toMiniJSON()));
});

router.get("/:submissionId", async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  assert(submission, "ERROR 404: Submission not found.");

  res.status(200).send(submission.toResponseJSON());
});

module.exports = router;
