const mongoose = require("mongoose");

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
  score: {
    type: Number,
    default: 0,
  },
});

teamSchema.statics.validate = function (team) {
  const schema = Joi.object({
    name: Joi.string().required(),
    members: Joi.array().items(Joi.string()).required(),
    contest: Joi.string().required(),
  });

  return schema.validate(team);
};

module.exports = mongoose.model("Team", teamSchema);
