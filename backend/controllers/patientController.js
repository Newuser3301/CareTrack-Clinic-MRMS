const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const User = require('../models/User');
const { ensurePatientAccess, getVisiblePatientFilter } = require('../utils/rbac');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const buildPatientFilter = (query) => {
  const filter = {};
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } }
    ];
  }
  if (query.assignedDoctor) filter.assignedDoctor = query.assignedDoctor;
  return filter;
};

const getPatients = async (req, res, next) => {
  try {
    const filter = await getVisiblePatientFilter(req, buildPatientFilter(req.query));
    const patients = await Patient.find(filter)
      .populate('assignedDoctor', 'fullName specialty department phone email')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDoctor').populate('user', 'name email role');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res);
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const { password, user: _ignoredUser, ...patientData } = req.body;
    const user = await User.create({
      name: patientData.fullName,
      email: patientData.email,
      password,
      role: 'patient'
    });

    try {
      const patient = await Patient.create({ ...patientData, user: user._id });
      const populated = await patient.populate([
        { path: 'assignedDoctor', select: 'fullName specialty department phone email' },
        { path: 'user', select: 'name email role' }
      ]);
      res.status(201).json(populated);
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res, { write: true });

    const { password, user: _ignoredUser, ...patientData } = req.body;
    if (req.user.role === 'doctor') delete patientData.assignedDoctor;
    Object.assign(patient, patientData);
    await patient.save();

    const userUpdate = {
      name: patient.fullName,
      email: patient.email,
      role: 'patient'
    };
    if (password) userUpdate.password = password;

    const user = await User.findById(patient.user).select('+password');
    if (user) {
      Object.assign(user, userUpdate);
      await user.save();
    }

    const populated = await patient.populate([
      { path: 'assignedDoctor', select: 'fullName specialty department phone email' },
      { path: 'user', select: 'name email role' }
    ]);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    await Diagnosis.deleteMany({ patient: req.params.id });
    if (patient.user) await User.findByIdAndDelete(patient.user);
    res.json({ message: 'Patient, linked diagnoses, and account deleted' });
  } catch (error) {
    next(error);
  }
};

const getPatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDoctor').populate('user', 'name email role');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res);

    const diagnoses = await Diagnosis.find({ patient: patient._id })
      .populate('createdBy', 'name role')
      .sort({ diagnosedDate: -1 });

    res.json({ patient, diagnoses });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientProfile
};
