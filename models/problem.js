const mongoose = require("mongoose");
const Joi = require("joi");

const problemSchema = new mongoose.Schema({
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
  statement: {
    type: String,
    required: true,
  },
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  constraints: {
    type: String,
  },
  samples: {
    type: [
      {
        _id: false,
        input: String,
        output: String,
        explanation: String,
      },
    ],
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
  },
  testCases: {
    type: [
      {
        _id: false,
        input: String,
        output: String,
      },
    ],
    required: true,
  },
  score: {
    type: Number,
    default: 100,
  },
  contest: {
    type: String,
    ref: "Contest",
  },
});

problemSchema.statics.validate = function (problem) {
  const schema = Joi.object({
    title: Joi.string().required(),
    statement: Joi.string().required(),

    input: Joi.string().required(),
    output: Joi.string().required(),
    constraints: Joi.string(),
    samples: Joi.array()
      .items(
        Joi.object({
          input: Joi.string().required(),
          output: Joi.string().required(),
          explanation: Joi.string(),
        })
      )
      .required(),
    difficulty: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    testCases: Joi.array()
      .items(
        Joi.object({
          input: Joi.string().required(),
          output: Joi.string().required(),
        })
      )
      .required(),
    score: Joi.number(),
    contest: Joi.string(),
  });

  return schema.validate(problem);
};

problemSchema.statics.generateId = async function (title) {
  let id = title.toLowerCase().replace(/ /g, "_");

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

module.exports = mongoose.model("Problem", problemSchema);
