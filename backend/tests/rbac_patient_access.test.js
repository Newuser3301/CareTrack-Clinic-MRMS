const test = require('node:test');
const assert = require('node:assert/strict');

const Doctor = require('../models/Doctor');
const { ensurePatientAccess } = require('../utils/rbac');

const createRes = () => {
  let statusCode = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    getStatus() {
      return statusCode;
    }
  };
};

test('ensurePatientAccess allows doctor when patient assignedDoctor is populated', async () => {
  const originalFindOne = Doctor.findOne.bind(Doctor);
  Doctor.findOne = async () => ({ _id: '507f191e810c19729de860ea' });

  const req = { user: { _id: 'user-doctor', role: 'doctor' } };
  const patient = { assignedDoctor: { _id: '507f191e810c19729de860ea' } };
  const res = createRes();

  await assert.doesNotReject(() => ensurePatientAccess(req, patient, res));

  Doctor.findOne = originalFindOne;
});

test('ensurePatientAccess allows patient when patient.user is populated', async () => {
  const req = { user: { _id: '507f191e810c19729de860eb', role: 'patient' } };
  const patient = { user: { _id: '507f191e810c19729de860eb' } };
  const res = createRes();

  await assert.doesNotReject(() => ensurePatientAccess(req, patient, res));
});

test('ensurePatientAccess forbids doctor when patient is not assigned to them', async () => {
  const originalFindOne = Doctor.findOne.bind(Doctor);
  Doctor.findOne = async () => ({ _id: '507f191e810c19729de860ea' });

  const req = { user: { _id: 'user-doctor', role: 'doctor' } };
  const patient = { assignedDoctor: { _id: '507f191e810c19729de860ff' } };
  const res = createRes();

  await assert.rejects(() => ensurePatientAccess(req, patient, res), /Forbidden/);
  assert.equal(res.getStatus(), 403);

  Doctor.findOne = originalFindOne;
});

