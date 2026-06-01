const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const SYSTEM_ROLES = ['super_admin', 'admin'];

const isSuperAdmin = (user) => user?.role === 'super_admin';
const isAdmin = (user) => user?.role === 'admin';
const isSystemManager = (user) => SYSTEM_ROLES.includes(user?.role);
const isClinician = (user) => user?.role === 'clinician';
const isReceptionist = (user) => user?.role === 'receptionist';
const canPromoteToSuperAdmin = (user) => user?.role === 'admin';

const forbid = (res, message = 'Forbidden: insufficient permissions') => {
  res.status(403);
  throw new Error(message);
};

const toObjectIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    return String(value);
  }
  return String(value);
};

const getDoctorProfile = (userId) => Doctor.findOne({ user: userId });
const getPatientProfile = (userId) => Patient.findOne({ user: userId });

const getVisiblePatientFilter = async (req, baseFilter = {}) => {
  if (isSystemManager(req.user)) return baseFilter;

  if (isClinician(req.user) || isReceptionist(req.user)) return baseFilter;

  if (req.user.role === 'doctor') {
    const doctor = await getDoctorProfile(req.user._id);
    if (!doctor) return { ...baseFilter, _id: null };
    return { ...baseFilter, assignedDoctor: doctor._id };
  }

  if (req.user.role === 'patient') {
    const patient = await getPatientProfile(req.user._id);
    if (!patient) return { ...baseFilter, _id: null };
    return { ...baseFilter, _id: patient._id };
  }

  return { ...baseFilter, _id: null };
};

const ensurePatientAccess = async (req, patient, res, { write = false } = {}) => {
  if (isSystemManager(req.user)) return;

  if (isClinician(req.user)) return;

  if (isReceptionist(req.user) && !write) return;

  if (req.user.role === 'doctor') {
    const doctor = await getDoctorProfile(req.user._id);
    const assignedDoctorId = toObjectIdString(patient.assignedDoctor);
    if (doctor && assignedDoctorId && assignedDoctorId === doctor._id.toString()) return;
  }

  if (!write && req.user.role === 'patient') {
    const patientUserId = toObjectIdString(patient.user);
    if (patientUserId && patientUserId === req.user._id.toString()) return;
  }

  forbid(res);
};

const ensureDiagnosisAccess = async (req, diagnosis, res, { write = false } = {}) => {
  const patient = diagnosis.patient;
  if (!patient || !patient.assignedDoctor) forbid(res);
  await ensurePatientAccess(req, patient, res, { write });
};

module.exports = {
  isSuperAdmin,
  isAdmin,
  isClinician,
  isReceptionist,
  isSystemManager,
  canPromoteToSuperAdmin,
  forbid,
  getDoctorProfile,
  getPatientProfile,
  getVisiblePatientFilter,
  ensurePatientAccess,
  ensureDiagnosisAccess
};
