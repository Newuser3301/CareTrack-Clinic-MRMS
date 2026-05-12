const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');

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
    const patients = await Patient.find(buildPatientFilter(req.query))
      .populate('assignedDoctor', 'fullName specialty department phone email')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDoctor');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const patient = await Patient.create(req.body);
    const populated = await patient.populate('assignedDoctor', 'fullName specialty department phone email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedDoctor', 'fullName specialty department phone email');

    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    res.json(patient);
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
    res.json({ message: 'Patient and linked diagnoses deleted' });
  } catch (error) {
    next(error);
  }
};

const getPatientProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDoctor');
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

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
