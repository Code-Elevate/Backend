const mongoose = require("mongoose");

const User = require("./user");

const teamSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  members: {
    type: [
      {
        type: String,
        ref: "User",
      },
    ],
    required: true,
  },
  contest: {
    type: String,
    ref: "Contest",
  },
  submissions: {
    type: [
      {
        type: String,
        ref: "Submission",
      },
    ],
  },
  scores: {
    type: Map,
    of: Number,
    default: {},
  },
  score: {
    type: Number,
    default: 0,
  },
});

teamSchema.methods.addSubmissionAndUpdateScore = function (submission) {
  this.submissions.push(submission._id);

  if (!this.scores[submission.problem]) {
    this.scores.set(submission.problem, submission.score);
  } else {
    this.scores[submission.problem] = Math.max(
      this.scores[submission.problem],
      submission.score
    );
  }

  let totalScore = 0;
  this.scores.forEach((score, problem, map) => {
    totalScore += score;
  });

  this.score = totalScore;
  return this.save();
};

teamSchema.statics.generateId = async function (name) {
  let id = name.split(" ").join("-").toLowerCase();

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

teamSchema.statics.validate = function (team) {
  const schema = Joi.object({
    name: Joi.string().required(),
    members: Joi.array().items(Joi.string()).required(),
    contest: Joi.string().required(),
  });

  return schema.validate(team);
};

teamSchema.statics.findTeam = function (contestId, userId) {
  return this.findOne({ contest: contestId, members: userId });
};

teamSchema.pre("save", async function () {
  // See if all members are valid
  const members = await User.find({ _id: { $in: this.members } });
  const existingMembers = members.map((member) => member._id);
  const missingMembers = this.members.filter(
    (member) => !existingMembers.includes(member)
  );

  if (missingMembers.length > 0) {
    throw new Error(`Invalid members: ${missingMembers.join(", ")}`);
  }
});

module.exports = mongoose.model("Team", teamSchema);
