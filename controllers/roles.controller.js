const { rolePermissions } = require('../config/constants');
const RoleModel = require('../models/Roles.model');

exports.getAllPermissions = (_, res) => {
  try {
    return res.json({
      result: rolePermissions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: error,
    });
  }
};

exports.patchRolePermissions = async (req, res) => {
  try {
    const { permission } = req.body;
    const { roleId } = req.params;
    const role = await RoleModel.findById(roleId);
    if (role) {
      if (role.permissions && Array.isArray(role.permissions)) {
        let index = role.permissions.indexOf(permission);
        if (index !== -1) {
          role.permissions.splice(index, 1);
          await role.save();
          return res.json({ message: 'Permission removed successfully' });
        } else {
          role.permissions.push(permission);
          await role.save();
          return res.json({ message: 'Permission added successfully' });
        }
      } else {
        role.permissions = [permission];
        await role.save();
        return res.json({ message: 'Permission added successfully' });
      }
    } else {
      return res.status(404).json({
        message: 'Oops! looks like role got deleted',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Something went wrong!',
      result: error,
    });
  }
};
