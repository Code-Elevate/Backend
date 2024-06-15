const express = require("express");

const User = require("../../models/user");

const router = express.Router();

// /users/search?query=id_or_name
router.get("/", async (req, res) => {
  const users = await User.find({
    _id: { $regex: req.query.query, $options: "i" },
    name: { $regex: req.query.query, $options: "i" },
  }).select("_id name email");

  res.status(200).send({
    users: users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
    })),
  });
});

module.exports = router;
