const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor user account is required'],
      unique: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true,
      maxlength: 120
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: 120
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
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    availability: {
      type: String,
      required: [true, 'Availability is required'],
      trim: true,
      maxlength: 200
    }
  },
  { timestamps: true }
);

doctorSchema.index({ fullName: 'text', specialty: 'text', department: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
