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
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    contests: user.teams.map((team) => ({
      id: team.contest._id,
      name: team.contest.name,
      startTime: team.contest.startTime,
      endTime: team.contest.endTime,
      duration: team.contest.duration,
      team: {
        id: team._id,
        name: team.name,
      },
      problems: team.contest.problems,
      score: team.score,
      ...(team.contest.leaderboard && {
        rank: team.contest.leaderboard.find(
          (entry) => entry.team.toString() === team._id.toString()
        ).rank,
      }),
    })),
  });
});

module.exports = router;
