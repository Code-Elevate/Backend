const express = require("express");
const assert = require("assert");

const Contest = require("../../models/contest");
const Team = require("../../models/team");
const User = require("../../models/user");

const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  let { id, name, members } = req.body;

  if (id) {
    let team = await Team.findById(id);
    assert(!team, "ERROR 400: Team id already exists.");
  } else {
    id = await Team.generateId(name);
  }

  let [contest, user] = await Promise.all([
    Contest.findById(req.params.contestId),
    User.findById(req.user._id),
  ]);
  assert(contest, "ERROR 404: Contest not found.");
  assert(user, "ERROR 404: User not found.");

  assert(
    contest.status !== "past",
    "ERROR 400: Cannot register for a past contest."
  );

  // If members contains emails of the user, replace it with the users id
  const emails = members.filter((member) => member.includes("@"));
  const emailToIdMap = {};

  if (emails.length > 0) {
    const users = await User.find({ email: { $in: emails } });
    users.forEach((user) => {
      emailToIdMap[user.email] = user._id;
    });
    members = members.map((member) => emailToIdMap[member] || member);
  }

  // If members don't include the user, add the user
  if (!members.includes(user._id)) members.push(user._id);

  // Check if one of the members is already registered for the contest
  let teams = await Promise.all(
    members.map((member) => Team.findTeam(contest._id, member))
  );
  const userToTeamMap = {};
  let registered = false;
  // Run a index loop
  teams.forEach((team, index) => {
    if (team) {
      userToTeamMap[members[index]] = team._id;
      registered = true;
    }
  });

  if (registered)
    return res.status(400).send({
      message: "One of the members is already registered for the contest.",
      user_team: userToTeamMap,
    });

  assert(
    members.length <= contest.maxTeamSize,
    `ERROR 400: Team size exceeds the maximum team size of ${contest.maxTeamSize}.`
  );

  let team = new Team({
    _id: id,
    name,
    members,
    contest: req.params.contestId,
  });

  await team.save();

  contest.addParticipantTeam(team._id);
  user.addTeam(team._id);

  const user_members = await Promise.all(
    members.map((member) => User.findById(member))
  );
  user_members.forEach((user) => user.addTeam(team._id));

  await Promise.all([
    contest.save(),
    user.save(),
    ...user_members.map((user) => user.save()),
  ]);

  res.status(201).send({
    message: "Team registered successfully.",
    team: {
      id: team._id,
      name: team.name,
      members: team.members,
    },
  });
});

module.exports = router;
