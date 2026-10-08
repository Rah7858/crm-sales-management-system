const User = require('../models/User');

const getTeamUserIds = async (managerId) => {
  const users = await User.find({ manager: managerId, isActive: true }, '_id');
  return users.map((u) => u._id);
};

const getAccessFilter = async (user) => {
  if (user.role === 'admin') {
    return {};
  }
  if (user.role === 'sales_manager') {
    const teamIds = await getTeamUserIds(user._id);
    return { assignedTo: { $in: [user._id, ...teamIds] } };
  }
  return { assignedTo: user._id };
};

const canAccessRecord = async (user, record) => {
  if (user.role === 'admin') return true;

  const assignedToId = record.assignedTo && record.assignedTo._id
    ? record.assignedTo._id.toString()
    : record.assignedTo
    ? record.assignedTo.toString()
    : null;

  // For unassigned records, only admin can access, unless business rule specifies otherwise.
  // The assignment says users can only access their assigned records or team records.
  if (!assignedToId) return false;

  if (user.role === 'sales_manager') {
    if (assignedToId === user._id.toString()) return true;
    const teamIds = await getTeamUserIds(user._id);
    return teamIds.some((id) => id.toString() === assignedToId);
  }

  return assignedToId === user._id.toString();
};

module.exports = {
  getAccessFilter,
  canAccessRecord,
  getTeamUserIds,
};
