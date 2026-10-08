const Timeline = require('../models/Timeline');

const logEvent = async ({ action, entityType, entityId, performedBy, previousValue, newValue, note, session }) => {
  const data = {
    action,
    entityType,
    entityId,
    performedBy,
  };
  
  if (previousValue !== undefined) data.previousValue = previousValue;
  if (newValue !== undefined) data.newValue = newValue;
  if (note !== undefined) data.note = note;

  const timelineEntry = new Timeline(data);
  return await timelineEntry.save({ session });
};

module.exports = {
  logEvent,
};
