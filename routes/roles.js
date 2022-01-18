const express = require("express");
const router = express.Router();

const {
    getAllPermissions
} = require("../controllers/roles.controller");

router.get("/permissions", getAllPermissions);

module.exports = router;