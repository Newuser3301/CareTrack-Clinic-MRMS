const mongoose = require('mongoose');
const { encryptText, decryptText } = require('../utils/cryptoFields');

const diagnosisSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required']
    },
    icdCode: {
      type: String,
      required: [true, 'ICD code is required'],
      trim: true,
      uppercase: true,
      maxlength: 20
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 500
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: [true, 'Severity is required']
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      set: encryptText,
      get: decryptText
    },
    diagnosedDate: {
      type: Date,
      required: [true, 'Diagnosed date is required'],
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

diagnosisSchema.set('toJSON', { getters: true });
diagnosisSchema.set('toObject', { getters: true });

diagnosisSchema.index({ icdCode: 'text', description: 'text' });

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
