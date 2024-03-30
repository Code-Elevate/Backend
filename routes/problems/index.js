const express = require("express");

const Problem = require("../../models/problem");

const router = express.Router();

router.get("/:id", async (req, res) => {
  let problem = await Problem.findById(req.params.id).populate("contest");
  if (!problem) return res.status(404).send({ message: "Problem not found." });

  if (problem.contest.status === "upcoming")
    return res.status(403).send({ message: "Problem is not available yet." });

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
    contest: {
      id: problem.contest._id,
      title: problem.contest.title,
      description: problem.contest.description,
      startTime: problem.contest.startTime,
      endTime: problem.contest.endTime,
      duration: problem.contest.duration,
      organizers: problem.contest.organizers,
    },
  });
});

module.exports = router;
