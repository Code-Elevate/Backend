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
    teamsCount: user.teams ? user.teams.length : 0,
    contestsCount:
      user.teams && user.teams.length
        ? user.teams.filter((team) => team.contest.status === "past").length
        : 0,
    submissionsCount:
      user.teams && user.teams.length
        ? user.teams.reduce((acc, team) => acc + team.submissions.length, 0)
        : 0,
    score:
      user.teams && user.teams.length
        ? user.teams.reduce((acc, team) => acc + team.score, 0)
        : 0,
    maxScore:
      user.teams && user.teams.length
        ? Math.max(...user.teams.map((team) => team.score), 0)
        : 0,
    bestRank:
      user.teams && user.teams.length
        ? Math.min(
            ...user.teams
              .filter((team) => team.contest.leaderboard)
              .map(
                (team) =>
                  team.contest.leaderboard.find(
                    (entry) => entry.team.toString() === team._id.toString()
                  ).rank
              )
          )
        : "-",
    registeredOn: user.registeredOn,
    lastLogin: user.lastLogin,
  });
});

module.exports = router;
