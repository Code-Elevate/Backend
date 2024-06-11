const express = require("express");
const assert = require("assert");

const Contest = require("../../models/contest");
const User = require("../../models/user");

const router = express.Router();

router.get("/", async (req, res) => {
  const { running, upcoming, past } = await Contest.contestsByStatus(
    req.user._id
  );

  res.status(200).send({
    running: running.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      organizers: contest.organizers,
    })),
    upcoming: upcoming.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      organizers: contest.organizers,
    })),
    past: past.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      organizers: contest.organizers,
    })),
  });
});

router.post("/add", async (req, res) => {
  const { error } = Contest.validate(req.body);
  assert(!error, error);

  // If id is provided, check if it already exists
  if (req.body.id) {
    let existing = await Contest.findById(req.body.id);
    assert(!existing, "ERROR 400: Contest id already exists.");
  } else {
    // Generate id if not provided
    req.body.id = await Contest.generateId(req.body.title);
  }

  let _penalty = 0;
  if (req.body.penalty) _penalty = req.body.penalty;

  // If members contains emails of the user, replace it with the users id
  const emails = req.body.organizers.filter((organizer) =>
    organizer.includes("@")
  );
  const emailToIdMap = {};

  if (emails.length > 0) {
    const users = await User.find({ email: { $in: emails } });
    users.forEach((user) => {
      emailToIdMap[user.email] = user._id;
    });
    req.body.organizers = req.body.organizers.map(
      (organizer) => emailToIdMap[organizer] || organizer
    );
  }

  // Check if the user is an organizer
  if (!req.body.organizers.includes(req.user._id))
    req.body.organizers.push(req.user._id);

  const contest = new Contest({
    _id: req.body.id,
    title: req.body.title,
    description: req.body.description,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    ...(req.body.maxTeamSize && { maxTeamSize: req.body.maxTeamSize }),
    organizers: req.body.organizers,
    problems: [],
    participants: [],
    penalty: {
      isOn: _penalty !== 0,
      value: _penalty,
    },
  });
  await contest.save();

  res.status(201).send({
    message: "Contest created successfully.",
    contest: contest.toResponseJSON(),
  });
});

router.post("/update", async (req, res) => {
  assert(req.body.id, "ERROR 400: Contest id is required.");

  let contest = await Contest.findById(req.body.id);
  assert(contest, "ERROR 404: Contest not found.");

  // Check if the user is an organizer
  assert(
    contest.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  let _penalty = 0;
  if (req.body.penalty) _penalty = req.body.penalty;
  else _penalty = contest.penalty.value;

  // Put the new data in the contest object
  contest = await Contest.findOneAndUpdate(
    { _id: req.body.id },
    {
      title: req.body.title,
      description: req.body.description,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      maxTeamSize: req.body.maxTeamSize,
      problems: req.body.problems,
      organizers: req.body.organizers,
      participants: req.body.participants,
      penalty: {
        isOn: _penalty !== 0,
        value: _penalty,
      },
    },
    { new: true }
  );

  res.status(200).send({
    message: "Contest updated successfully.",
    contest: contest.toResponseJSON(),
  });
});

router.post("/delete", async (req, res) => {
  let contest = await Contest.findById(req.body.id);
  assert(contest, "ERROR 404: Contest not found.");

  // Check if the user is an organizer
  assert(
    contest.organizers.includes(req.user._id),
    "ERROR 403: Access denied."
  );

  // Check if contest has already started or ended
  assert(
    contest.status === "upcoming",
    "ERROR 400: Contest cannot be deleted after it has started."
  );

  await Contest.findByIdAndDelete(req.body.id);
  res.status(200).send({ message: "Contest deleted successfully." });
});

module.exports = router;
