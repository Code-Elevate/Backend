const express = require("express");
const assert = require("assert");

const Problem = require("../../models/problem");
const Submission = require("../../models/submission");
const Team = require("../../models/team");
const auth = require("../../middleware/auth");

const router = express.Router({ mergeParams: true });

router.get("/", auth, async (req, res) => {});

router.get("/all", async (req, res) => {});

router.get("/:submissionId", async (req, res) => {});

module.exports = router;
