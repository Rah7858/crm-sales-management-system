const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'follow_up', 'reminder', 'note', 'task'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedTo: {
      entityType: {
        type: String,
        enum: ['lead', 'customer', 'deal', 'user'],
        required: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ dueDate: 1 });
activitySchema.index({ assignedTo: 1 });
activitySchema.index({ status: 1 });

activitySchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
