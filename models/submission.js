const mongoose = require("mongoose");
const Joi = require("joi");

const submissionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  problem: {
    type: String,
    ref: "Problem",
    required: true,
  },
  team: {
    type: String,
    ref: "Team",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  runtime: {
    language: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
  },
  verdict: {
    type: String,
    required: true,
  },
  verdictMessage: {
    type: String,
    default: "",
  },
  time: {
    type: Date,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    default: 0,
  },
});

submissionSchema.statics.validate = function (submission) {
  const schema = Joi.object({
    problem: Joi.string().required(),
    team: Joi.string().required(),
    code: Joi.string().required(),
    runtime: Joi.object({
      language: Joi.string().required(),
      version: Joi.string().required(),
    }).required(),
    verdict: Joi.string().required(),
    time: Joi.date().required(),
    score: Joi.number().required(),
  });

  return schema.validate(submission, { allowUnknown: true });
};

submissionSchema.methods.toResponseJSON = function () {
  return {
    id: this._id,
    problem: this.problem,
    team: this.team,
    code: this.code,
    runtime: this.runtime,
    verdict: this.verdict,
    verdictMessage: this.verdictMessage,
    time: this.time,
    score: this.score,
  };
};

submissionSchema.methods.toMiniJSON = function () {
  return {
    id: this._id,
    problem: this.problem,
    team: this.team,
    runtime: this.runtime,
    verdict: this.verdict,
    time: this.time,
  };
};

module.exports = mongoose.model("Submission", submissionSchema);
