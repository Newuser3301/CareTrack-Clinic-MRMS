const { validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const RefreshSession = require('../models/RefreshSession');
const { isSuperAdmin, isAdmin } = require('../utils/rbac');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    next(new Error(errors.array().map((error) => error.msg).join(', ')));
    return false;
  }
  return true;
};

const getUsers = async (req, res, next) => {
  try {
    const filter = isSuperAdmin(req.user) ? {} : { role: { $in: ['doctor', 'patient'] } };
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    if (isAdmin(req.user) && !['doctor', 'patient'].includes(req.body.role)) {
      res.status(403);
      throw new Error('Admins can only create doctor and patient accounts');
    }

    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  if (!handleValidation(req, res, next)) return;

  try {
    const update = { ...req.body };
    if (!update.password) delete update.password;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (isAdmin(req.user)) {
      if (!['doctor', 'patient'].includes(user.role)) {
        res.status(403);
        throw new Error('Admins cannot update admin or super admin accounts');
      }
      if (update.role && !['doctor', 'patient'].includes(update.role)) {
        res.status(403);
        throw new Error('Admins cannot assign admin or super_admin roles');
      }
    }

    if (!isSuperAdmin(req.user) && (user.role === 'super_admin' || update.role === 'super_admin')) {
      res.status(403);
      throw new Error('Only Super Admin can manage super_admin accounts');
    }

    const shouldRevokeSessions = Boolean(update.password || (update.role && update.role !== user.role));
    Object.assign(user, update);
    if (shouldRevokeSessions) user.tokenVersion += 1;
    await user.save();
    if (shouldRevokeSessions) {
      await RefreshSession.updateMany({ user: user._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    }
    user.password = undefined;
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (isAdmin(req.user) && !['doctor', 'patient'].includes(user.role)) {
      res.status(403);
      throw new Error('Admins cannot delete admin or super admin accounts');
    }

    if (!isSuperAdmin(req.user) && user.role === 'super_admin') {
      res.status(403);
      throw new Error('Only Super Admin can delete super_admin accounts');
    }

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) {
        const assignedCount = await Patient.countDocuments({ assignedDoctor: doctor._id });
        if (assignedCount > 0) {
          res.status(400);
          throw new Error('This doctor is assigned to one or more patients and cannot be deleted.');
        }
        await Doctor.findByIdAndDelete(doctor._id);
      }
    }

    if (user.role === 'patient') {
      const patient = await Patient.findOneAndDelete({ user: user._id });
      if (patient) await Diagnosis.deleteMany({ patient: patient._id });
    }

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

const createAdmin = (req, res, next) => {
  req.body.role = 'admin';
  return createUser(req, res, next);
};

const createDoctorAccount = (req, res, next) => {
  req.body.role = 'doctor';
  return createUser(req, res, next);
};

const createPatientAccount = (req, res, next) => {
  req.body.role = 'patient';
  return createUser(req, res, next);
};

module.exports = { getUsers, createUser, updateUser, deleteUser, createAdmin, createDoctorAccount, createPatientAccount };
