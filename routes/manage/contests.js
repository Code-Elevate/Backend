const express = require("express");

const Contest = require("../../models/contest");

const router = express.Router();

router.post("/add", async (req, res) => {
  const { error } = Contest.validate(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  // If id is provided, check if it already exists
  if (req.body.id) {
    let existing = await Contest.findById(req.body.id);
    if (existing)
      return res.status(400).send({ message: "Contest id already exists." });
  } else {
    // Generate id if not provided
    req.body.id = await Contest.generateId(req.body.title);
  }

  // Check if the user is an organizer
  if (!req.body.organizers.includes(req.user.id))
    req.body.organizers.push(req.user.id);

  const contest = new Contest({
    _id: req.body.id,
    title: req.body.title,
    description: req.body.description,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    organizers: req.body.organizers,
    problems: [],
    participants: [],
  });
  await contest.save();

  res.status(201).send({
    message: "Contest created successfully.",
    contest: {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      problems: contest.problems,
      organizers: contest.organizers,
      participants: contest.participants,
    },
  });
});

router.post("/update", async (req, res) => {
  if (!req.body.id)
    return res.status(400).send({ message: "Contest id is required." });

  let contest = await Contest.findById(req.body.id);
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  // Check if the user is an organizer
  if (!contest.organizers.includes(req.user.id))
    return res.status(403).send({ message: "Access denied." });

  // Put the new data in the contest object
  contest = await Contest.findByIdAndUpdate(
    req.body.id,
    {
      title: req.body.title,
      description: req.body.description,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      problems: req.body.problems,
      organizers: req.body.organizers,
      participants: req.body.participants,
    },
    { new: true }
  );

  res.status(200).send({
    message: "Contest updated successfully.",
    contest: {
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      problems: contest.problems,
      organizers: contest.organizers,
      participants: contest.participants,
    },
  });
});

router.post("/delete", async (req, res) => {
  let contest = await Contest.findById(req.body.id);
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  // Check if the user is an organizer
  if (!contest.organizers.includes(req.user.id))
    return res.status(403).send({ message: "Access denied." });

  // Check if contest has already started or ended
  if (contest.status !== "upcoming")
    return res.status(400).send({
      message: "Contest cannot be deleted after it has started.",
    });

  await Contest.findByIdAndDelete(req.body.id);

  res.status(200).send({ message: "Contest deleted successfully." });
});

module.exports = router;
