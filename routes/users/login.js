const express = require("express");

const User = require("../../models/user");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .send({ message: "Email and password are required." });

  let user = await User.findOne({ email });
  if (!user) return res.status(400).send({ message: "User not registered." });

  const validPassword = await user.validatePassword(password);
  if (!validPassword)
    return res.status(400).send({ message: "Invalid email or password." });

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
