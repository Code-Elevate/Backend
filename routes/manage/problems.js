const express = require("express");

const Problem = require("../../models/problem");
const Contest = require("../../models/contest");

const router = express.Router({ mergeParams: true });

router.post("/add", async (req, res) => {
  const { error } = Problem.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  // Check if the contest exists
  let contest = await Contest.findById(req.params.contestId);
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  // Check if the contest has started
  if (contest.status !== "upcoming")
    return res
      .status(400)
      .send({ message: "Cannot add problems to a running or past contest." });

  // Check if the user is an organizer
  if (!contest.organizers.includes(req.user._id))
    return res.status(403).send({ message: "Access denied." });

  // If id is provided, check if it already exists
  if (req.body.id) {
    let existing = await Problem.findById(req.body.id);
    if (existing)
      return res.status(400).send({ message: "Problem id already exists." });
  } else {
    // Generate id if not provided
    req.body.id = await Problem.generateId(req.body.title);
  }

  const problem = new Problem({
    _id: req.body.id,
    title: req.body.title,
    statement: req.body.statement,
    input: req.body.input,
    output: req.body.output,
    constraints: req.body.constraints,
    samples: req.body.samples,
    difficulty: req.body.difficulty,
    tags: req.body.tags,
    testCases: req.body.testCases,
    contest: req.params.contestId,
  });
  contest.addProblem(problem._id);

  await Promise.all([problem.save(), contest.save()]);

  res.status(201).send({
    message: "Problem added successfully.",
    problem: {
      id: problem._id,
      title: problem.title,
      statement: problem.statement,
      input: problem.input,
      output: problem.output,
      constraints: problem.constraints,
      samples: problem.samples,
      difficulty: problem.difficulty,
      tags: problem.tags,
      testCases: problem.testCases,
      contest: problem.contest,
    },
  });
});

router.post("/update", async (req, res) => {
  if (!req.body.id)
    return res.status(400).send({ message: "Problem id is required." });

  let [problem, contest] = await Promise.all([
    Problem.findById(req.body.id),
    Contest.findById(req.params.contestId),
  ]);

  if (!problem) return res.status(404).send({ message: "Problem not found." });
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  // Check if the user is an organizer
  if (!contest.organizers.includes(req.user._id))
    return res.status(403).send({ message: "Access denied." });

  // Check if the contest has started
  if (contest.status !== "upcoming")
    return res.status(400).send({
      message: "Cannot update problems in a running or past contest.",
    });

  // Put the new data in the problem object
  problem = await Problem.findByIdAndUpdate(
    req.body.id,
    {
      title: req.body.title,
      statement: req.body.statement,
      input: req.body.input,
      output: req.body.output,
      constraints: req.body.constraints,
      samples: req.body.samples,
      difficulty: req.body.difficulty,
      tags: req.body.tags,
      testCases: req.body.testCases,
    },
    { new: true }
  );

  res.status(200).send({
    message: "Problem updated successfully.",
    problem: {
      id: problem._id,
      title: problem.title,
      statement: problem.statement,
      input: problem.input,
      output: problem.output,
      constraints: problem.constraints,
      samples: problem.samples,
      difficulty: problem.difficulty,
      tags: problem.tags,
      testCases: problem.testCases,
      contest: problem.contest,
    },
  });
});

router.post("/delete", async (req, res) => {
  if (!req.body.id)
    return res.status(400).send({ message: "Problem id is required." });

  let [problem, contest] = await Promise.all([
    Problem.findById(req.body.id),
    Contest.findById(req.params.contestId),
  ]);

  if (!problem) return res.status(404).send({ message: "Problem not found." });
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  // Check if the user is an organizer
  if (!contest.organizers.includes(req.user.id))
    return res.status(403).send({ message: "Access denied." });

  // Check if the contest has started
  if (contest.status !== "upcoming")
    return res.status(400).send({
      message: "Cannot delete problems in a running or past contest.",
    });

  contest.removeProblem(req.body.id);
  await Promise.all([Problem.findByIdAndDelete(req.body.id), contest.save()]);

  res.status(200).send({ message: "Problem deleted successfully." });
});

module.exports = router;
