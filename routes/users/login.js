const express = require("express");
const assert = require("assert");

const User = require("../../models/user");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  assert(email, "ERROR 400: Email is required.");
  assert(password, "ERROR 400: Password is required.");

  let user = await User.findOne({ email });
  assert(user, "ERROR 400: User not registered.");

  const validPassword = await user.validatePassword(password);
  assert(validPassword, "ERROR 400: Invalid email or password.");

  const token = user.generateAuthToken();

  res
    .status(200)
    .header("x-auth-token", token)
    .send({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
});

module.exports = router;
