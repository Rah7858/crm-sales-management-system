const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    value: {
      type: Number,
      required: true,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expectedRevenue: {
      type: Number,
    },
    expectedClosingDate: {
      type: Date,
    },
    stage: {
      type: String,
      enum: ['qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'qualification',
    },
    lostReason: {
      type: String,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

dealSchema.index({ stage: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ customer: 1 });
dealSchema.index({ lead: 1 });
dealSchema.index({ expectedClosingDate: 1 });
dealSchema.index({ createdAt: -1 });

const Deal = mongoose.model('Deal', dealSchema);
module.exports = Deal;
