const express = require("express");
const assert = require("assert");

const Problem = require("../../models/problem");
const { runtimes } = require("../../utils/execute");

const router = express.Router();

router.get("/:id", async (req, res) => {
  let [problem, _runtimes] = await Promise.all([
    Problem.findById(req.params.id).populate("contest"),
    runtimes(),
  ]);

  assert(problem, "ERROR 404: Problem not found.");
  assert(
    problem.contest.status !== "upcoming",
    "ERROR 403: Problem is not available yet."
  );

  res.status(200).send({
    id: problem._id,
    title: problem.title,
    statement: problem.statement,
    input: problem.input,
    output: problem.output,
    constraints: problem.constraints,
    samples: problem.samples,
    difficulty: problem.difficulty,
    tags: problem.tags,
    score: problem.score,
    contest: {
      id: problem.contest._id,
      title: problem.contest.title,
      description: problem.contest.description,
      startTime: problem.contest.startTime,
      endTime: problem.contest.endTime,
      duration: problem.contest.duration,
      organizers: problem.contest.organizers,
    },
    runtimes: _runtimes,
  });
});

module.exports = router;
