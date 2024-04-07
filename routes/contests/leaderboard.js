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

  if (contest.leaderboard && contest.leaderboard.length > 0) {
    const idToName = {};
    contest.participants.forEach((participant) => {
      idToName[participant._id.toString()] = participant.name;
    });

    const idToScores = {};

    contest.participants.forEach((participant) => {
      idToScores[participant._id.toString()] = participant.scores;
    });

    const idToSubmissions = {};

    contest.participants.forEach((participant) => {
      idToSubmissions[participant._id.toString()] = participant.submissions;
    });

    res.status(200).send(
      contest.leaderboard.map((entry) => ({
        id: entry.team,
        name: idToName[entry.team],
        score: entry.score,
        submissions: idToSubmissions[entry.team],
        scores: idToScores[entry.team],
        rank: entry.rank,
      }))
    );
    return;
  }

  const participants = contest.participants.map((participant) => ({
    id: participant._id,
    name: participant.name,
    score: participant.score,
    scores: participant.scores,
    submissions: participant.submissions,
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
