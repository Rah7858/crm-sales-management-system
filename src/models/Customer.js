const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    company: {
      type: String,
    },
    address: {
      type: String,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

customerSchema.index({ email: 1 });
customerSchema.index({ assignedTo: 1 });
customerSchema.index({ lead: 1 });
customerSchema.index({ createdAt: -1 });

customerSchema.index({ name: 'text', email: 'text', company: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
