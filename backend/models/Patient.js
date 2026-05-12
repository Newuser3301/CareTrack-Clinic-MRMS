const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'other'],
      required: [true, 'Gender is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: 30
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: 240
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Assigned doctor is required']
    },
    emergencyContact: {
      type: String,
      required: [true, 'Emergency contact is required'],
      trim: true,
      maxlength: 120
    }
  },
  { timestamps: true }
);

patientSchema.index({ fullName: 'text', phone: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
