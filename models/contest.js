const mongoose = require("mongoose");
const Joi = require("joi");

const User = require("./user");
const Team = require("./team");

const contestSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  maxTeamSize: {
    type: Number,
    default: 2,
  },
  problems: {
    type: [
      {
        type: String,
        ref: "Problem",
      },
    ],
  },
  organizers: {
    type: [
      {
        type: String,
        ref: "User",
      },
    ],
  },
  participants: {
    type: [
      {
        type: String,
        ref: "Team",
      },
    ],
  },
  penalty: {
    type: {
      _id: false,
      isOn: {
        type: Boolean,
        default: false,
      },
      value: {
        type: Number,
        default: 0,
      },
    },
  },
  leaderboard: {
    type: [
      {
        _id: false,
        team: {
          type: String,
          ref: "Team",
        },
        score: Number,
        rank: Number,
      },
    ],
  },
});

const contestEventSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  endAt: {
    type: Date,
    expires: 0,
  },
});

const ContestEvent = mongoose.model("ContestEvent", contestEventSchema);

contestSchema.virtual("status").get(function () {
  const now = new Date();
  if (now < this.startTime) return "upcoming";
  if (now > this.endTime) return "past";
  return "running";
});

contestSchema.statics.running = function () {
  return this.find().then((contests) =>
    contests.filter((contest) => contest.status === "running")
  );
};

contestSchema.statics.upcoming = function () {
  return this.find().then((contests) =>
    contests.filter((contest) => contest.status === "upcoming")
  );
};

contestSchema.statics.past = function () {
  return this.find().then((contests) =>
    contests.filter((contest) => contest.status === "past")
  );
};

contestSchema.statics.sortByStatus = function (contests) {
  const running = [];
  const upcoming = [];
  const past = [];

  contests.forEach((contest) => {
    if (contest.status === "running") running.push(contest);
    else if (contest.status === "upcoming") upcoming.push(contest);
    else past.push(contest);
  });

  return { running, upcoming, past };
};

contestSchema.statics.contestsByStatus = async function (userId = null) {
  let contests;
  if (userId) {
    contests = await this.find({ organizers: userId });
  } else {
    contests = await this.find();
  }
  return this.sortByStatus(contests);
};

contestSchema.statics.findRunningOfUser = async function (userId) {
  const teams = await Team.find({ members: userId });
  const contests = await this.find({ participants: { $in: teams } });
  return contests.filter((contest) => contest.status === "running");
};

contestSchema.statics.validate = function (contest) {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    maxTeamSize: Joi.number().min(1).max(6),
    organizers: Joi.array().items(Joi.string().required()),
    penalty: Joi.object({
      isOn: Joi.boolean(),
      value: Joi.number().min(0),
    }),
  });

  return schema.validate(contest, { allowUnknown: true });
};

contestSchema.statics.generateId = async function (title) {
  let id = title.toLowerCase().replace(/\s+/g, "-");

  let existing = await this.findById(id);

  if (existing) {
    let count = 1;
    while (true) {
      let newId = `${id}_${count}`;
      existing = await this.findById(newId);
      if (!existing) {
        id = newId;
        break;
      }
      count++;
    }
  }

  return id;
};

contestSchema.methods.addProblem = function (problemId) {
  if (!this.problems.includes(problemId)) this.problems.push(problemId);
};

contestSchema.methods.removeProblem = function (problemId) {
  this.problems = this.problems.filter((id) => id !== problemId);
};

contestSchema.methods.addParticipantTeam = function (teamId) {
  if (!this.participants.includes(teamId)) this.participants.push(teamId);
};

contestSchema.virtual("duration").get(function () {
  const date = new Date(this.endTime - this.startTime);
  var str = "";
  str +=
    date.getUTCDate() - 1 !== 0
      ? date.getUTCDate() - 1 + ` day${date.getUTCDate() - 1 > 1 ? "s" : ""} `
      : "";
  str +=
    date.getUTCHours() !== 0
      ? date.getUTCHours() + ` hr${date.getUTCHours() > 1 ? "s" : ""} `
      : "";
  str +=
    date.getUTCMinutes() !== 0
      ? date.getUTCMinutes() + ` min${date.getUTCMinutes() > 1 ? "s" : ""} `
      : "";
  str +=
    date.getUTCSeconds() !== 0
      ? date.getUTCSeconds() + ` sec${date.getUTCSeconds() > 1 ? "s" : ""} `
      : "";
  return str.trim();
});

contestSchema.methods.toResponseJSON = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    startTime: this.startTime,
    endTime: this.endTime,
    maxTeamSize: this.maxTeamSize,
    duration: this.duration,
    status: this.status,
    problems: this.problems,
    organizers: this.organizers,
    participants: this.participants,
    penalty: this.penalty,
  };
};

contestSchema.pre("save", async function (next) {
  // Check if dates are valid
  if (this.startTime >= this.endTime)
    throw new Error("Start time must be before end time.");

  // Only allow start time in the future
  if (this.isModified("startTime")) {
    const now = new Date();
    if (this.startTime < now)
      throw new Error("Start time must be in the future.");
  }

  // Check if organizers are valid
  const organizerIds = this.organizers;
  const existingOrganizers = await User.find({ _id: { $in: organizerIds } });
  const existingOrganizerIds = existingOrganizers.map(
    (organizer) => organizer._id
  );
  const missingOrganizers = organizerIds.filter(
    (organizerId) => !existingOrganizerIds.includes(organizerId)
  );

  if (missingOrganizers.length > 0) {
    throw new Error(`Invalid organizers: ${missingOrganizers.join(", ")}`);
  }

  // Add contest event
  if (this.isNew) {
    const contestEvent = new ContestEvent({
      _id: this._id,
      endAt: this.endTime,
    });
    await contestEvent.save();
  }

  next();
});

contestSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (update.startTime) {
    const now = new Date();
    if (Date.parse(update.startTime) < now)
      throw new Error("Start time must be in the future.");
  }

  if (update.endTime) {
    const contestEvent = await ContestEvent.findById(this.getQuery()._id);
    contestEvent.endAt = update.endTime;
    await contestEvent.save();
  }

  if (update.organizers) {
    const organizerIds = update.organizers;
    const existingOrganizers = await User.find({ _id: { $in: organizerIds } });
    const existingOrganizerIds = existingOrganizers.map(
      (organizer) => organizer._id
    );
    const missingOrganizers = organizerIds.filter(
      (organizerId) => !existingOrganizerIds.includes(organizerId)
    );

    if (missingOrganizers.length > 0) {
      throw new Error(`Invalid organizers: ${missingOrganizers.join(", ")}`);
    }
  }
});

contestSchema.methods.calculateLeaderboard = async function () {
  const participants = await Team.find({ _id: { $in: this.participants } });

  const leaderboard = participants.map((team) => ({
    team: team._id,
    score: team.score,
  }));

  leaderboard.sort((a, b) => b.score - a.score);

  leaderboard.forEach((team, index) => {
    team.rank = index + 1;
  });

  this.leaderboard = leaderboard;
  await this.save();
};

const Contest = mongoose.model("Contest", contestSchema);

ContestEvent.watch().on("change", async (change) => {
  if (change.operationType === "delete") {
    const contestId = change.documentKey._id;
    const contest = await Contest.findById(contestId);
    await contest.calculateLeaderboard();
  }
});

module.exports = Contest;
