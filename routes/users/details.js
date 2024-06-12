const express = require("express");

const User = require("../../models/user");

const router = express.Router();

router.get("/", async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "teams",
    populate: {
      path: "contest",
    },
  });

  res.status(200).send({
    id: user._id,
    name: user.name,
    email: user.email,
    teamsCount: user.teams.length,
    contestsCount: user.teams.filter((team) => team.contest.status === "past")
      .length,
    submissionsCount: user.teams.reduce(
      (acc, team) => acc + team.submissions.length,
      0
    ),
    score: user.teams.reduce((acc, team) => acc + team.score, 0),
    maxScore: Math.max(...user.teams.map((team) => team.score), 0),
    bestRank: Math.min(
      ...user.teams
        .filter((team) => team.contest.leaderboard)
        .map(
          (team) =>
            team.contest.leaderboard.find(
              (entry) => entry.team.toString() === team._id.toString()
            ).rank
        )
    ),
    registeredOn: user.registeredOn,
    lastLogin: user.lastLogin,
  });
});

module.exports = router;
