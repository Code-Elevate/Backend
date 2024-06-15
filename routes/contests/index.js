const express = require("express");
const assert = require("assert");

const Contest = require("../../models/contest");

const router = express.Router();

router.get("/", async (req, res) => {
  const [{ running, upcoming, past }, users_running] = await Promise.all([
    Contest.contestsByStatus(),
    req.user && req.user._id ? Contest.findRunningOfUser(req.user._id) : null,
  ]);

  res.status(200).send({
    ...(users_running && {
      users_running: users_running.map((contest) => ({
        id: contest._id,
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        duration: contest.duration,
        organizers: contest.organizers,
      })),
    }),
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

router.get("/:id", async (req, res) => {
  let contest = await Contest.findById(req.params.id).populate(
    "problems",
    "_id title difficulty tags"
  );
  assert(contest, "ERROR 404: Contest not found.");

  res.status(200).send({
    id: contest._id,
    title: contest.title,
    description: contest.description,
    longDescription: contest.longDescription,
    status: contest.status,
    startTime: contest.startTime,
    endTime: contest.endTime,
    maxTeamSize: contest.maxTeamSize,
    duration: contest.duration,
    organizers: contest.organizers,
    penalty: contest.penalty,
    ...(contest.status !== "upcoming" && {
      problems: contest.problems.map((problem) => ({
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags,
      })),
    }),
  });
});

module.exports = router;
