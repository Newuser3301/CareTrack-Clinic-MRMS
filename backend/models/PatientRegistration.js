const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\\S+@\\S+\\.\\S+$/, 'Please provide a valid email']
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
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ''
    },
    createdPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    createdUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

registrationSchema.index({ status: 1, createdAt: -1 });
registrationSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('PatientRegistration', registrationSchema);

