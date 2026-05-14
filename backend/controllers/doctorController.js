const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { getDoctorProfile, isSystemManager } = require('../utils/rbac');

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
    let filter = buildDoctorFilter(req.query);

    if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfile(req.user._id);
      filter = { ...filter, _id: doctor?._id || null };
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      filter = { ...filter, _id: patient?.assignedDoctor || null };
    }

    const doctors = await Doctor.find(filter).populate('user', 'name email role').sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email role');
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    if (!isSystemManager(req.user)) {
      if (req.user.role === 'doctor' && doctor.user?._id?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Forbidden: insufficient permissions');
      }

      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient || patient.assignedDoctor.toString() !== doctor._id.toString()) {
          res.status(403);
          throw new Error('Forbidden: insufficient permissions');
        }
      }
    }

    let patientsFilter = { assignedDoctor: doctor._id };
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user._id });
      patientsFilter = { assignedDoctor: doctor._id, _id: patient?._id || null };
    }

    const patients = await Patient.find(patientsFilter).sort({ fullName: 1 });
    res.json({ ...doctor.toObject(), patients });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const { password, user: _ignoredUser, ...doctorData } = req.body;
    const user = await User.create({
      name: doctorData.fullName,
      email: doctorData.email,
      password,
      role: 'doctor'
    });

    try {
      const doctor = await Doctor.create({ ...doctorData, user: user._id });
      const populated = await doctor.populate('user', 'name email role');
      res.status(201).json(populated);
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    const { password, user: _ignoredUser, ...doctorData } = req.body;
    Object.assign(doctor, doctorData);
    await doctor.save();

    const userUpdate = {
      name: doctor.fullName,
      email: doctor.email,
      role: 'doctor'
    };
    if (password) userUpdate.password = password;

    const user = await User.findById(doctor.user).select('+password');
    if (user) {
      Object.assign(user, userUpdate);
      await user.save();
    }

    const populated = await doctor.populate('user', 'name email role');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const assignedCount = await Patient.countDocuments({ assignedDoctor: req.params.id });
    if (assignedCount > 0) {
      res.status(400);
      throw new Error('This doctor is assigned to one or more patients and cannot be deleted.');
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    if (doctor.user) await User.findByIdAndDelete(doctor.user);

    res.json({ message: 'Doctor and linked account deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
