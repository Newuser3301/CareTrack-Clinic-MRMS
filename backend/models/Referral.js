const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/cryptoFields');

const referralSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required']
    },
    fromDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    toDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    toDepartment: {
      type: String,
      trim: true,
      maxlength: 120
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: 800
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      set: encryptText,
      get: decryptText
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

referralSchema.set('toJSON', { getters: true });
referralSchema.set('toObject', { getters: true });

referralSchema.index({ patient: 1, createdAt: -1 });
referralSchema.index({ status: 1, createdAt: -1 });
referralSchema.index({ toDoctor: 1, status: 1 });
referralSchema.index({ toDepartment: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema);

