const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  teams: {
    type: [
      {
        type: String,
        ref: "Team",
      },
    ],
  },
  registeredOn: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, name: this.name, email: this.email },
    process.env.JWT_PRIVATE_KEY
  );
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = Date.now();
  await this.save();
};

userSchema.statics.validate = function (user) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(user, { allowUnknown: true });
};

userSchema.statics.generateId = async function (email) {
  let id = email.split("@")[0];

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

userSchema.methods.addTeam = function (teamId) {
  if (!this.teams.includes(teamId)) this.teams.push(teamId);
};

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

module.exports = mongoose.model("User", userSchema);
