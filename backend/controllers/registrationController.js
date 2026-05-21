const { validationResult } = require('express-validator');
const PatientRegistration = require('../models/PatientRegistration');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { isSystemManager } = require('../utils/rbac');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const populateRegistration = (query) =>
  query
    .populate('assignedDoctor', 'fullName specialty department phone email')
    .populate('requestedBy', 'name role')
    .populate('reviewedBy', 'name role')
    .populate('createdPatient')
    .populate('createdUser', 'name email role');

const buildRegistrationFilter = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const q = String(query.search).trim();
    filter.$or = [{ fullName: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }, { phone: { $regex: q, $options: 'i' } }];
  }
  return filter;
};

const getRegistrations = async (req, res, next) => {
  try {
    if (!isSystemManager(req.user) && req.user.role !== 'receptionist') {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
    const filter = buildRegistrationFilter(req.query);
    const regs = await populateRegistration(PatientRegistration.find(filter).sort({ createdAt: -1 }).limit(250));
    res.json(regs);
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    if (!isSystemManager(req.user) && req.user.role !== 'receptionist') {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
    const reg = await populateRegistration(PatientRegistration.findById(req.params.id));
    if (!reg) {
      res.status(404);
      throw new Error('Registration not found');
    }
    res.json(reg);
  } catch (error) {
    next(error);
  }
};

const createRegistration = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    if (!isSystemManager(req.user) && req.user.role !== 'receptionist') {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }

    const doctor = await Doctor.findById(req.body.assignedDoctor);
    if (!doctor) {
      res.status(400);
      throw new Error('Assigned doctor not found');
    }

    const created = await PatientRegistration.create({
      ...req.body,
      requestedBy: req.user._id
    });
    const populated = await populateRegistration(PatientRegistration.findById(created._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const approveRegistration = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    if (!isSystemManager(req.user)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }

    const reg = await PatientRegistration.findById(req.params.id);
    if (!reg) {
      res.status(404);
      throw new Error('Registration not found');
    }
    if (reg.status !== 'pending') {
      res.status(400);
      throw new Error('Registration is not pending');
    }

    const password = req.body.password;
    if (!password) {
      res.status(400);
      throw new Error('Password is required to approve registration');
    }

    const existingUser = await User.findOne({ email: reg.email });
    if (existingUser) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    const user = await User.create({
      name: reg.fullName,
      email: reg.email,
      password,
      role: 'patient'
    });

    try {
      const patient = await Patient.create({
        user: user._id,
        fullName: reg.fullName,
        dateOfBirth: reg.dateOfBirth,
        gender: reg.gender,
        phone: reg.phone,
        email: reg.email,
        address: reg.address,
        assignedDoctor: reg.assignedDoctor,
        emergencyContact: reg.emergencyContact
      });

      reg.status = 'approved';
      reg.reviewedBy = req.user._id;
      reg.reviewedAt = new Date();
      reg.createdPatient = patient._id;
      reg.createdUser = user._id;
      await reg.save();

      const populated = await populateRegistration(PatientRegistration.findById(reg._id));
      res.json(populated);
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const rejectRegistration = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    if (!isSystemManager(req.user)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }

    const reg = await PatientRegistration.findById(req.params.id);
    if (!reg) {
      res.status(404);
      throw new Error('Registration not found');
    }
    if (reg.status !== 'pending') {
      res.status(400);
      throw new Error('Registration is not pending');
    }

    reg.status = 'rejected';
    reg.reviewedBy = req.user._id;
    reg.reviewedAt = new Date();
    reg.rejectionReason = req.body.rejectionReason || '';
    await reg.save();

    const populated = await populateRegistration(PatientRegistration.findById(reg._id));
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegistrations,
  getRegistrationById,
  createRegistration,
  approveRegistration,
  rejectRegistration
};

