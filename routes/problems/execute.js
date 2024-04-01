const express = require("express");
const assert = require("assert");

const Problem = require("../../models/problem");
const Submission = require("../../models/submission");
const Team = require("../../models/team");
const { execute, getRuntime } = require("../../utils/execute");
const auth = require("../../middleware/auth");

const router = express.Router({ mergeParams: true });

router.post("/run", async (req, res) => {
  let { language, version, code, stdin } = req.body;

  assert(language, "Language is required.");
  assert(code, "Code is required.");
  assert(stdin, "stdin is required.");

  if (!version) {
    let runtime = await getRuntime(language);
    version = runtime.version;
  }

  const result = await execute(language, version, code, stdin);
  res.status(200).send(result);
});

router.post("/submit", auth, async (req, res) => {
  const submissionTime = Date.now();

  let { language, version, code } = req.body;

  assert(language, "Language is required.");
  assert(code, "Code is required.");

  if (!version) {
    let runtime = await getRuntime(language);
    version = runtime.version;
  }

  const problem = await Problem.findById(req.params.problemId).populate(
    "contest"
  );
  assert(problem, "ERROR 404: Problem not found.");

  // Check if the contest is running
  assert(
    problem.contest.status === "running",
    "ERROR 403: Contest is not running."
  );

  // Find the team of the user
  const team = await Team.findTeam(problem.contest._id, req.user._id);
  assert(team, "ERROR 404: Team not found.");

  const stdins = problem.testCases.map((testCase) => testCase.input);

  const results = await execute(language, version, code, stdins);

  if (results.status !== "success") {
    // If contest has penalty on, get the penalty
    let penalty = 0;
    if (problem.contest.penalty.isOn)
      penalty = problem.contest.penalty.value * -1;

    let verdict = "";
    let verdictMessage = "";

    switch (results.status) {
      case "timeout":
        verdict = "TLE";
        verdictMessage = "Time Limit Exceeded";
        break;
      case "compile_error":
        verdict = "CE";
        verdictMessage = "Compile Error";
        break;
      case "runtime_error":
        verdict = "RE";
        verdictMessage = "Runtime Error";
        break;
    }

    // Create submission
    const submission = new Submission({
      _id: `${problem.contest._id}-${problem._id}-${team._id}-${submissionTime}`,
      problem: problem._id,
      team: team._id,
      code,
      runtime: { language, version },
      verdict,
      verdictMessage,
      time: submissionTime,
      score: penalty,
    });

    await Promise.all([
      submission.save(),
      team.addSubmissionAndUpdateScore(submission),
    ]);

    return res.status(200).send({
      status: results.status,
      message: verdictMessage,
      submission: submission.toResposeJSON(),
    });
  }

  // Check if the outputs match
  const expectedOutputs = problem.testCases.map((testCase) => testCase.output);
  const outputs = results.run.map((run) => run.stdout);

  const correct = outputs.every(
    (output, i) => output.trim() === expectedOutputs[i].trim()
  );

  // If outputs don't match, find the first mismatch
  if (!correct) {
    let mismatch = -1;
    mismatch = outputs.findIndex(
      (output, i) => output.trim() !== expectedOutputs[i].trim()
    );

    // If contest has penalty on, get the penalty
    let penalty = 0;
    if (problem.contest.penalty.isOn)
      penalty = problem.contest.penalty.value * -1;

    // Create submission
    const submission = new Submission({
      _id: `${problem.contest._id}-${problem._id}-${team._id}-${submissionTime}`,
      problem: problem._id,
      team: team._id,
      code,
      runtime: { language, version },
      verdict: "WA",
      verdictMessage: `Output mismatch at test case ${mismatch + 1}.`,
      time: submissionTime,
      score: penalty,
    });

    await Promise.all([
      submission.save(),
      team.addSubmissionAndUpdateScore(submission),
    ]);

    return res.status(200).send({
      status: "wrong_answer",
      message: `Output mismatch at test case ${mismatch + 1}.`,
      submission: submission.toResposeJSON(),
    });
  }

  // If outputs match
  // Calculate the score on the basis of the submission time
  /*
      Example:
      contest starts at 1000
      contest ends at 2000

      problem score = 100

      submissions are at 1: 1200, 2: 1500 and 3: 1800


      submission 1: 1200

      timeTakenToSubmit = 1200 - 1000 = 200
      contestDuration = 2000 - 1000 = 1000
      timePercent = 200 / 1000 = 0.2
      timeAdvantage = 1 - 0.2 = 0.8
      scoreIncrement = 100 * 0.8 = 80
      totalScore = 100 + 80 = 180


      submission 2: 1500

      timeTakenToSubmit = 1500 - 1000 = 500
      contestDuration = 2000 - 1000 = 1000
      timePercent = 500 / 1000 = 0.5
      timeAdvantage = 1 - 0.5 = 0.5
      scoreIncrement = 100 * 0.5 = 50
      totalScore = 100 + 50 = 150


      submission 3: 1800

      timeTakenToSubmit = 1800 - 1000 = 800
      contestDuration = 2000 - 1000 = 1000
      timePercent = 800 / 1000 = 0.8
      timeAdvantage = 1 - 0.8 = 0.2
      scoreIncrement = 100 * 0.2 = 20
      totalScore = 100 + 20 = 120
      */
  const timeTakenToSubmit = submissionTime - problem.contest.startTime;
  const contestDuration = problem.contest.endTime - problem.contest.startTime;

  const timePercent = timeTakenToSubmit / contestDuration;
  const timeAdvantage = 1 - timePercent;
  const scoreIncrement = problem.score * timeAdvantage;
  const score = problem.score + scoreIncrement;

  const submission = new Submission({
    _id: `${problem.contest._id}-${problem._id}-${team._id}-${submissionTime}`,
    problem: problem._id,
    team: team._id,
    code,
    runtime: { language, version },
    verdict: "AC",
    verdictMessage: "Accepted",
    time: submissionTime,
    score,
  });

  await Promise.all([
    submission.save(),
    team.addSubmissionAndUpdateScore(submission),
  ]);

  res.status(200).send({
    status: "success",
    message: "Accepted",
    submission: submission.toResposeJSON(),
  });
});

module.exports = router;
