const express = require("express");
const assert = require("assert");

const User = require("../../models/user");

const router = express.Router();

router.post("/", async (req, res) => {
  const { error } = User.validate(req.body);
  assert(!error, error);

  let user = await User.findOne({ email: req.body.email });
  assert(!user, "ERROR 400: User already registered.");

  user = new User({
    _id: await User.generateId(req.body.email),
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  await user.save();

  const token = user.generateAuthToken();

  res
    .status(201)
    .header("x-auth-token", token)
    .send({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
});

module.exports = router;
