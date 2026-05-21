const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/cryptoFields');

const emergencyMessageSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    department: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
      set: encryptText,
      get: decryptText
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    handledAt: Date,
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  { timestamps: true }
);

emergencyMessageSchema.set('toJSON', { getters: true });
emergencyMessageSchema.set('toObject', { getters: true });

emergencyMessageSchema.index({ status: 1, createdAt: -1 });
emergencyMessageSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyMessage', emergencyMessageSchema);

