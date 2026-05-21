const { validationResult } = require('express-validator');
const EmergencyMessage = require('../models/EmergencyMessage');
const Patient = require('../models/Patient');
const { ensurePatientAccess, getVisiblePatientFilter, isSystemManager, isClinician, isReceptionist } = require('../utils/rbac');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const populateEmergency = (query) =>
  query
    .populate({ path: 'patient', populate: [{ path: 'assignedDoctor' }, { path: 'user', select: 'name email role' }] })
    .populate('createdBy', 'name role')
    .populate('handledBy', 'name role');

const buildEmergencyFilter = async (req) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };

  const visiblePatients = await getVisiblePatientFilter(req);
  const patientIds = await Patient.find(visiblePatients).distinct('_id');

  if (!isSystemManager(req.user) && !isClinician(req.user) && !isReceptionist(req.user)) {
    filter.patient = { $in: patientIds };
  } else if (req.query.patient && patientIds.map((id) => id.toString()).includes(String(req.query.patient))) {
    filter.patient = req.query.patient;
  }

  if (req.query.search) {
    const q = String(req.query.search).trim();
    const matchingPatients = await Patient.find({
      _id: { $in: patientIds },
      $or: [{ fullName: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }]
    }).distinct('_id');
    filter.patient = { $in: matchingPatients };
  }

  return filter;
};

const getEmergencies = async (req, res, next) => {
  try {
    const filter = await buildEmergencyFilter(req);
    const items = await populateEmergency(EmergencyMessage.find(filter).sort({ createdAt: -1 }).limit(250));
    res.json(items);
  } catch (error) {
    next(error);
  }
};

const createEmergency = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    let patient = null;
    if (req.body.patient) {
      patient = await Patient.findById(req.body.patient);
      if (!patient) {
        res.status(404);
        throw new Error('Patient not found');
      }
      await ensurePatientAccess(req, patient, res);
    } else if (req.user.role === 'patient') {
      patient = await Patient.findOne({ user: req.user._id });
    }

    const created = await EmergencyMessage.create({
      patient: patient?._id,
      department: req.body.department || '',
      subject: req.body.subject,
      message: req.body.message,
      createdBy: req.user._id
    });

    const populated = await populateEmergency(EmergencyMessage.findById(created._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const updateEmergency = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const existing = await EmergencyMessage.findById(req.params.id).populate('patient');
    if (!existing) {
      res.status(404);
      throw new Error('Emergency message not found');
    }

    if (existing.patient?._id) {
      await ensurePatientAccess(req, existing.patient, res, { write: true });
    } else if (!isSystemManager(req.user) && !isClinician(req.user) && !isReceptionist(req.user)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }

    if (req.body.status !== undefined) existing.status = req.body.status;
    if (req.body.resolutionNote !== undefined) existing.resolutionNote = req.body.resolutionNote;

    existing.handledBy = req.user._id;
    existing.handledAt = new Date();
    await existing.save();

    const populated = await populateEmergency(EmergencyMessage.findById(existing._id));
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmergencies, createEmergency, updateEmergency };

