const express = require("express");
const assert = require("assert");

const Problem = require("../../models/problem");
const Contest = require("../../models/contest");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const problems = await Contest.findById(req.params.contestId).populate(
    "problems"
  );

  assert(problems, "ERROR 404: Contest not found.");

  // Check if the user is an organizer
  assert(
    problems.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  res.status(200).send({
    problems: problems.problems.map((problem) => ({
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
      score: problem.score,
      contest: problem.contest,
    })),
  });
});

router.post("/add", async (req, res) => {
  const { error } = Problem.validate(req.body);
  assert(!error, error);

  // Check if the contest exists
  let contest = await Contest.findById(req.params.contestId);
  assert(contest, "ERROR 404: Contest not found.");

  // Check if the contest has started
  assert(
    contest.status === "upcoming",
    "ERROR 400: Cannot add problems to a running or past contest."
  );

  // Check if the user is an organizer
  assert(
    contest.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  // If id is provided, check if it already exists
  if (req.body.id) {
    let existing = await Problem.findById(req.body.id);
    assert(!existing, "ERROR 400: Problem id already exists.");
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
    score: req.body.score,
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
      score: problem.score,
      contest: problem.contest,
    },
  });
});

router.post("/update", async (req, res) => {
  assert(req.body.id, "ERROR 400: Problem id is required.");

  let [problem, contest] = await Promise.all([
    Problem.findById(req.body.id),
    Contest.findById(req.params.contestId),
  ]);

  assert(problem, "ERROR 404: Problem not found.");
  assert(contest, "ERROR 404: Contest not found.");

  // Check if the user is an organizer
  assert(
    contest.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  // Check if the contest has started
  assert(
    contest.status === "upcoming",
    "ERROR 400: Cannot update problems in a running or past contest."
  );

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
      score: req.body.score,
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
      score: problem.score,
      contest: problem.contest,
    },
  });
});

router.post("/delete", async (req, res) => {
  assert(req.body.id, "ERROR 400: Problem id is required.");

  let [problem, contest] = await Promise.all([
    Problem.findById(req.body.id),
    Contest.findById(req.params.contestId),
  ]);

  assert(problem, "ERROR 404: Problem not found.");
  assert(contest, "ERROR 404: Contest not found.");

  // Check if the user is an organizer
  assert(
    contest.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  // Check if the contest has started
  assert(
    contest.status === "upcoming",
    "ERROR 400: Cannot delete problems in a running or past contest."
  );

  contest.removeProblem(req.body.id);
  await Promise.all([Problem.findByIdAndDelete(req.body.id), contest.save()]);

  res.status(200).send({ message: "Problem deleted successfully." });
});

module.exports = router;
