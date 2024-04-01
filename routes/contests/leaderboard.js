const express = require("express");
const assert = require("assert");

const Contest = require("../../models/contest");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const contest = await Contest.findById(req.params.contestId).populate(
    "participants"
  );

  assert(contest, "ERROR 404: Contest not found.");

  assert(
    contest.status !== "upcoming",
    "ERROR 403: Contest is not available yet."
  );

  const participants = contest.participants.map((participant) => ({
    id: participant._id,
    name: participant.name,
    score: participant.score,
    scores: participant.scores,
  }));

  participants.sort((a, b) => b.score - a.score);

  res.status(200).send(
    participants.map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }))
  );
});

module.exports = router;
