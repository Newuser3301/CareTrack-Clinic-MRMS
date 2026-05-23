const { validationResult } = require('express-validator');
const Referral = require('../models/Referral');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { ensurePatientAccess, getVisiblePatientFilter, getDoctorProfile, isSystemManager } = require('../utils/rbac');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const populateReferral = (query) =>
  query
    .populate({ path: 'patient', populate: [{ path: 'assignedDoctor' }, { path: 'user', select: 'name email role' }] })
    .populate('fromDoctor')
    .populate('toDoctor')
    .populate('createdBy', 'name role')
    .populate('updatedBy', 'name role');

const buildReferralFilter = async (req) => {
  const filter = {};
  const { status, priority, patient, toDoctor, toDepartment, search } = req.query;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (patient) filter.patient = patient;
  if (toDoctor) filter.toDoctor = toDoctor;
  if (toDepartment) filter.toDepartment = { $regex: toDepartment, $options: 'i' };

  const visiblePatients = await getVisiblePatientFilter(req);
  const patientIds = await Patient.find(visiblePatients).distinct('_id');

  if (search) {
    const q = String(search).trim();
    const matchingPatients = await Patient.find({
      _id: { $in: patientIds },
      $or: [{ fullName: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }]
    }).distinct('_id');
    filter.patient = { $in: matchingPatients };
  } else if (!filter.patient) {
    filter.patient = { $in: patientIds };
  } else if (patientIds.map((id) => id.toString()).includes(String(filter.patient))) {
    // allowed
  } else {
    filter.patient = null;
  }

  return filter;
};

const getReferrals = async (req, res, next) => {
  try {
    const filter = await buildReferralFilter(req);
    const referrals = await populateReferral(Referral.find(filter).sort({ createdAt: -1 }).limit(250));
    res.json(referrals);
  } catch (error) {
    next(error);
  }
};

const getReferralById = async (req, res, next) => {
  try {
    const referral = await populateReferral(Referral.findById(req.params.id));
    if (!referral) {
      res.status(404);
      throw new Error('Referral not found');
    }

    if (referral.patient?._id) {
      await ensurePatientAccess(req, referral.patient, res);
    }

    res.json(referral);
  } catch (error) {
    next(error);
  }
};

const createReferral = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, patient, res);

    let fromDoctor = req.body.fromDoctor;
    if (!isSystemManager(req.user)) {
      fromDoctor = undefined;
    }
    if (req.user.role === 'doctor') {
      const doctor = await getDoctorProfile(req.user._id);
      if (doctor) fromDoctor = doctor._id;
    }

    if (req.body.toDoctor) {
      const toDoctorExists = await Doctor.exists({ _id: req.body.toDoctor });
      if (!toDoctorExists) {
        res.status(400);
        throw new Error('Target doctor not found');
      }
    }

    const created = await Referral.create({
      patient: patient._id,
      fromDoctor,
      toDoctor: req.body.toDoctor || undefined,
      toDepartment: req.body.toDepartment || '',
      institutionName: req.body.institutionName || 'CareTrack Clinic',
      referralNumber: req.body.referralNumber || '',
      validityPeriod: req.body.validityPeriod || '',
      responsibleDoctorName: req.body.responsibleDoctorName || '',
      receptionistName: req.body.receptionistName || '',
      reason: req.body.reason,
      notes: req.body.notes || '',
      priority: req.body.priority || 'normal',
      status: req.body.status || 'pending',
      createdBy: req.user._id
    });

    const populated = await populateReferral(Referral.findById(created._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const updateReferral = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const existing = await Referral.findById(req.params.id).populate('patient');
    if (!existing) {
      res.status(404);
      throw new Error('Referral not found');
    }

    if (existing.patient?._id) {
      await ensurePatientAccess(req, existing.patient, res, { write: true });
    }

    if (!isSystemManager(req.user) && req.body.patient && req.body.patient !== existing.patient?._id?.toString()) {
      res.status(403);
      throw new Error('Forbidden: cannot reassign patient');
    }

    if (req.body.toDoctor) {
      const toDoctorExists = await Doctor.exists({ _id: req.body.toDoctor });
      if (!toDoctorExists) {
        res.status(400);
        throw new Error('Target doctor not found');
      }
    }

    const allowed = [
      'toDoctor',
      'toDepartment',
      'institutionName',
      'referralNumber',
      'validityPeriod',
      'responsibleDoctorName',
      'receptionistName',
      'reason',
      'notes',
      'priority',
      'status'
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) existing[key] = req.body[key];
    });
    existing.updatedBy = req.user._id;
    await existing.save();

    const referral = await populateReferral(Referral.findById(existing._id));
    res.json(referral);
  } catch (error) {
    next(error);
  }
};

const deleteReferral = async (req, res, next) => {
  try {
    if (!isSystemManager(req.user)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
    const referral = await Referral.findByIdAndDelete(req.params.id);
    if (!referral) {
      res.status(404);
      throw new Error('Referral not found');
    }
    res.json({ message: 'Referral deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  deleteReferral
};
