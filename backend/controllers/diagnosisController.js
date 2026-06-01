const { validationResult } = require('express-validator');
const Diagnosis = require('../models/Diagnosis');
const Patient = require('../models/Patient');
const { ensureDiagnosisAccess, ensurePatientAccess, getVisiblePatientFilter, isSystemManager } = require('../utils/rbac');
const { searchIcd10cm } = require('../utils/icd10cmApi');
const { searchMkb10 } = require('../utils/mkb10Catalog');

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
  query.populate('patient', 'fullName phone assignedDoctor user').populate('createdBy', 'name role');

const getDiagnoses = async (req, res, next) => {
  try {
    const visiblePatients = await getVisiblePatientFilter(req);
    const patientIds = await Patient.find(visiblePatients).distinct('_id');
    const filter = { ...buildDiagnosisFilter(req.query), patient: { $in: patientIds } };
    if (req.query.patient && patientIds.map((id) => id.toString()).includes(req.query.patient)) {
      filter.patient = req.query.patient;
    }

    const diagnoses = await populateDiagnosis(
      Diagnosis.find(filter).sort({ diagnosedDate: -1 })
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
    await ensureDiagnosisAccess(req, diagnosis, res);
    res.json(diagnosis);
  } catch (error) {
    next(error);
  }
};

const createDiagnosis = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res, { write: true });

    const diagnosis = await Diagnosis.create({ ...req.body, createdBy: req.user._id });
    const populated = await diagnosis.populate([
        { path: 'patient', select: 'fullName phone assignedDoctor user' },
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
    const existing = await Diagnosis.findById(req.params.id).populate('patient');
    if (!existing) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }
    await ensureDiagnosisAccess(req, existing, res, { write: true });

    if (req.body.patient && req.body.patient !== existing.patient._id.toString()) {
      const newPatient = await Patient.findById(req.body.patient);
      if (!newPatient) {
        res.status(404);
        throw new Error('Patient not found');
      }
      await ensurePatientAccess(req, newPatient, res, { write: true });
    }

    Object.assign(existing, req.body);
    await existing.save();
    const diagnosis = await populateDiagnosis(Diagnosis.findById(existing._id));
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
    if (!isSystemManager(req.user)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }

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
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res);

    const diagnoses = await populateDiagnosis(
      Diagnosis.find({ patient: req.params.patientId }).sort({ diagnosedDate: -1 })
    );
    res.json(diagnoses);
  } catch (error) {
    next(error);
  }
};

const searchIcd10Codes = async (req, res, next) => {
  try {
    const results = await searchIcd10cm(req.query.terms, { count: req.query.count });
    res.json(results);
  } catch (error) {
    res.status(502);
    next(new Error(`Unable to search ICD-10-CM codes: ${error.message}`));
  }
};

const searchMkb10Codes = async (req, res, next) => {
  try {
    const results = searchMkb10(req.query.terms, { count: req.query.count });
    res.json(results);
  } catch (error) {
    res.status(500);
    next(new Error(`Unable to search MKB-10 codes: ${error.message}`));
  }
};

module.exports = {
  getDiagnoses,
  getDiagnosisById,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  getDiagnosesByPatient,
  searchIcd10Codes,
  searchMkb10Codes
};
