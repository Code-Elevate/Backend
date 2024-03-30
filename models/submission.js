const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
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
  time: {
    type: Date,
    required: true,
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
  });

  return schema.validate(submission);
};

module.exports = mongoose.model("Submission", submissionSchema);
