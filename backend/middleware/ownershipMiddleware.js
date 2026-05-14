const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const { ensurePatientAccess, ensureDiagnosisAccess } = require('../utils/rbac');

const canAccessPatient = ({ write = false } = {}) => async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id || req.params.patientId);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }

    await ensurePatientAccess(req, patient, res, { write });
    req.patientRecord = patient;
    next();
  } catch (error) {
    next(error);
  }
};

const canAccessDiagnosis = ({ write = false } = {}) => async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id).populate('patient');
    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    await ensureDiagnosisAccess(req, diagnosis, res, { write });
    req.diagnosisRecord = diagnosis;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { canAccessPatient, canAccessDiagnosis };
