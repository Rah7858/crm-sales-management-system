const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['lead', 'customer', 'deal'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

timelineSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const Timeline = mongoose.model('Timeline', timelineSchema);
module.exports = Timeline;
