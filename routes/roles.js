const express = require("express");
const router = express.Router();

const {
    getAllPermissions,
    patchRolePermissions
} = require("../controllers/roles.controller");

router.get("/permissions", getAllPermissions);
router.patch('/:roleId/permissions', patchRolePermissions);

module.exports = router;