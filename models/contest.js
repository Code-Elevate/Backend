const mongoose = require("mongoose");
const Joi = require("joi");
const ms = require("ms");

const User = require("./user");

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
  submissions: {
    type: [
      {
        type: String,
        ref: "Submission",
      },
    ],
  },
  leaderboard: {
    type: [
      {
        team: {
          type: String,
          ref: "Team",
        },
        score: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
});

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

contestSchema.statics.contestsByStatus = async function () {
  let contests = await this.find();
  let running = [];
  let upcoming = [];
  let past = [];

  contests.forEach((contest) => {
    let status = contest.status;

    if (status === "running") running.push(contest);
    else if (status === "upcoming") upcoming.push(contest);
    else past.push(contest);
  });

  return { running, upcoming, past };
};

contestSchema.statics.validate = function (contest) {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    problems: Joi.array().items(Joi.string()),
    organizers: Joi.array().items(Joi.string()),
    participants: Joi.array().items(Joi.string()),
  });

  return schema.validate(contest);
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
  this.problems.push(problemId);
};

contestSchema.methods.removeProblem = function (problemId) {
  this.problems = this.problems.filter((id) => id !== problemId);
};

contestSchema.virtual("duration").get(function () {
  return ms(this.endTime - this.startTime, { long: true });
});

contestSchema.pre("save", async function (next) {
  // Check if dates are valid
  if (this.startTime >= this.endTime)
    throw new Error("Start time must be before end time.");

  // Only allow start time in the future
  const now = new Date();
  if (this.startTime < now)
    throw new Error("Start time must be in the future.");

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
    throw new Error(`Organizers ${missingOrganizers.join(", ")} do not exist.`);
  }

  next();
});

module.exports = mongoose.model("Contest", contestSchema);
