const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required']
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required']
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:mm format']
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled'],
      default: 'scheduled'
    },
    type: {
      type: String,
      default: 'Consultation',
      trim: true,
      maxlength: 80
    },
    location: {
      type: String,
      default: 'Clinic',
      trim: true,
      maxlength: 120
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });
appointmentSchema.index({ patient: 1, date: 1, time: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

