const express = require("express");
const ms = require("ms");

const Contest = require("../../models/contest");

const router = express.Router();

router.get("/", async (req, res) => {
  const { running, upcoming, past } = await Contest.contestsByStatus();

  res.status(200).send({
    running: running.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
    })),
    upcoming: upcoming.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
    })),
    past: past.map((contest) => ({
      id: contest._id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
    })),
  });
});

router.get("/:id", async (req, res) => {
  let contest = await Contest.findById(req.params.id).populate(
    "problems",
    "_id title difficulty tags"
  );
  if (!contest) return res.status(404).send({ message: "Contest not found." });

  res.status(200).send({
    id: contest._id,
    title: contest.title,
    description: contest.description,
    status: contest.status,
    startTime: contest.startTime,
    endTime: contest.endTime,
    duration: contest.duration,
    organizers: contest.organizers,
    ...(contest.status !== "upcoming" && { problems: contest.problems }),
  });
});

module.exports = router;
