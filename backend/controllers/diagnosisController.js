const { validationResult } = require('express-validator');
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

const buildDiagnosisFilter = (query) => {
  const filter = {};
  if (query.search) {
    filter.$or = [
      { icdCode: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } }
    ];
  }
  if (query.severity) filter.severity = query.severity;
  if (query.patient) filter.patient = query.patient;
  if (query.icdCode) filter.icdCode = { $regex: query.icdCode, $options: 'i' };
  return filter;
};

const populateDiagnosis = (query) =>
  query.populate('patient', 'fullName phone assignedDoctor').populate('createdBy', 'name role');

const getDiagnoses = async (req, res, next) => {
  try {
    const diagnoses = await populateDiagnosis(
      Diagnosis.find(buildDiagnosisFilter(req.query)).sort({ diagnosedDate: -1 })
    );
    res.json(diagnoses);
  } catch (error) {
    next(error);
  }
};

const getDiagnosisById = async (req, res, next) => {
  try {
    const diagnosis = await populateDiagnosis(Diagnosis.findById(req.params.id));
    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }
    res.json(diagnosis);
  } catch (error) {
    next(error);
  }
};

const createDiagnosis = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const diagnosis = await Diagnosis.create({ ...req.body, createdBy: req.user._id });
    const populated = await diagnosis.populate([
      { path: 'patient', select: 'fullName phone assignedDoctor' },
      { path: 'createdBy', select: 'name role' }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const updateDiagnosis = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const diagnosis = await populateDiagnosis(
      Diagnosis.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
    );

    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    res.json(diagnosis);
  } catch (error) {
    next(error);
  }
};

const deleteDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findByIdAndDelete(req.params.id);
    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    res.json({ message: 'Diagnosis deleted' });
  } catch (error) {
    next(error);
  }
};

const getDiagnosesByPatient = async (req, res, next) => {
  try {
    const diagnoses = await populateDiagnosis(
      Diagnosis.find({ patient: req.params.patientId }).sort({ diagnosedDate: -1 })
    );
    res.json(diagnoses);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiagnoses,
  getDiagnosisById,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  getDiagnosesByPatient
};
