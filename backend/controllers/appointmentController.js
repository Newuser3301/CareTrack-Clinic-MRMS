const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { getPatientProfile, isSystemManager, isReceptionist } = require('../utils/rbac');
const { generateSlotsForDate, isPastDate, isWeekendDate, parseTimeToMinutes } = require('../utils/appointmentSlots');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const assertBookingAllowed = async ({ req, res, patientId }) => {
  if (req.user.role === 'patient') {
    const patientProfile = await getPatientProfile(req.user._id);
    if (!patientProfile || patientProfile._id.toString() !== patientId.toString()) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
  }

  if (!isSystemManager(req.user) && !isReceptionist(req.user) && req.user.role !== 'patient') {
    res.status(403);
    throw new Error('Forbidden: insufficient permissions');
  }
};

const getDoctorAvailableTimes = async (req, res, next) => {
  try {
    const date = String(req.query.date || '').trim();
    if (!date) {
      res.status(400);
      throw new Error('Date is required');
    }
    if (isPastDate(date)) {
      res.status(400);
      throw new Error("O‘tib ketgan sanaga bron qilish mumkin emas");
    }
    if (isWeekendDate(date)) {
      res.status(400);
      throw new Error('Weekend kunlari bron qilish mumkin emas');
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    const slots = generateSlotsForDate(doctor, date, { intervalMinutes: 30 });
    if (!slots.length) return res.json({ date, doctor_id: doctor._id, available_times: [] });

    const booked = await Appointment.find({ doctor: doctor._id, date, status: 'scheduled' }).select('time -_id');
    const bookedSet = new Set(booked.map((row) => row.time));
    const available = slots.filter((t) => !bookedSet.has(t));

    return res.json({ date, doctor_id: doctor._id, available_times: available });
  } catch (error) {
    return next(error);
  }
};

const createAppointment = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const doctorId = req.body.doctor_id;
    const patientId = req.body.patient_id;
    const date = String(req.body.date || '').trim();
    const time = String(req.body.time || '').trim();

    if (isPastDate(date)) {
      res.status(400);
      throw new Error("O‘tib ketgan sanaga bron qilish mumkin emas");
    }
    if (isWeekendDate(date)) {
      res.status(400);
      throw new Error('Weekend kunlari bron qilish mumkin emas');
    }
    if (parseTimeToMinutes(time) === null) {
      res.status(400);
      throw new Error('Time must be in HH:mm format');
    }

    const [doctor, patient] = await Promise.all([Doctor.findById(doctorId), Patient.findById(patientId)]);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    await assertBookingAllowed({ req, res, patientId: patient._id });

    const slots = generateSlotsForDate(doctor, date, { intervalMinutes: 30 });
    if (!slots.includes(time)) {
      res.status(400);
      throw new Error('Shifokor ish vaqtida bo‘lishi kerak');
    }

    const exists = await Appointment.exists({ doctor: doctor._id, date, time, status: 'scheduled' });
    if (exists) {
      res.status(409);
      throw new Error('Bu vaqt band');
    }

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient._id,
      date,
      time,
      createdBy: req.user._id
    });

    res.status(201).json({
      _id: appointment._id,
      doctor_id: doctor._id,
      patient_id: patient._id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getDoctorAvailableTimes
};

