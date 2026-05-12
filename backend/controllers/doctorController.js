const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const buildDoctorFilter = (query) => {
  const filter = {};
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { specialty: { $regex: query.search, $options: 'i' } },
      { department: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } }
    ];
  }
  if (query.specialty) filter.specialty = { $regex: query.specialty, $options: 'i' };
  if (query.department) filter.department = { $regex: query.department, $options: 'i' };
  if (query.availability) filter.availability = { $regex: query.availability, $options: 'i' };
  return filter;
};

const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find(buildDoctorFilter(req.query)).sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    const patients = await Patient.find({ assignedDoctor: doctor._id }).sort({ fullName: 1 });
    res.json({ ...doctor.toObject(), patients });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const assignedCount = await Patient.countDocuments({ assignedDoctor: req.params.id });
    if (assignedCount > 0) {
      res.status(400);
      throw new Error('Cannot delete a doctor assigned to patients');
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
