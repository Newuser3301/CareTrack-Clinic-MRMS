const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const { ensurePatientAccess } = require('../utils/rbac');

const buildDiagnosisReport = async (patientId) => {
  const patient = await Patient.findById(patientId)
    .populate('assignedDoctor', 'fullName specialty department phone email')
    .populate('user', 'name email role');
  if (!patient) return null;

  const diagnoses = await Diagnosis.find({ patient: patient._id })
    .populate('createdBy', 'name role')
    .sort({ diagnosedDate: -1 });

  return { patient, diagnoses };
};

const getDiagnosisReportJson = async (req, res, next) => {
  try {
    const result = await buildDiagnosisReport(req.params.id);
    if (!result) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, result.patient, res);

    res.json({
      generatedAt: new Date().toISOString(),
      preparedBy: { id: String(req.user._id), name: req.user.name, role: req.user.role },
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const getDiagnosisReportHtml = async (req, res, next) => {
  try {
    const result = await buildDiagnosisReport(req.params.id);
    if (!result) {
      res.status(404);
      throw new Error('Patient not found');
    }
    await ensurePatientAccess(req, result.patient, res);

    const { patient, diagnoses } = result;
    const doctor = patient.assignedDoctor;

    const rows = diagnoses
      .map((d) => {
        const date = d.diagnosedDate ? new Date(d.diagnosedDate).toLocaleDateString() : '-';
        return `<tr>
  <td>${escapeHtml(date)}</td>
  <td>${escapeHtml(d.icdCode)}</td>
  <td>${escapeHtml(d.severity)}</td>
  <td>${escapeHtml(d.description)}</td>
</tr>`;
      })
      .join('\n');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Diagnosis Report</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; color: #0f172a; }
      .header { display:flex; justify-content:space-between; gap: 16px; align-items:flex-start; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
      h1 { margin: 0; font-size: 20px; }
      h2 { margin: 0 0 8px 0; font-size: 14px; color: #334155; text-transform: uppercase; letter-spacing: .06em; }
      .muted { color:#64748b; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; vertical-align: top; }
      th { font-size: 12px; color: #334155; }
      td { font-size: 13px; }
      @media print { .no-print { display:none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>CareTrack Clinic — Diagnosis Report</h1>
        <div class="muted">Generated: ${escapeHtml(new Date().toISOString())}</div>
      </div>
      <div class="no-print">
        <button onclick="window.print()">Print</button>
      </div>
    </div>

    <div class="card">
      <h2>Patient</h2>
      <div><strong>${escapeHtml(patient.fullName)}</strong> — ${escapeHtml(patient.phone)} — ${escapeHtml(patient.email)}</div>
      <div class="muted">DOB: ${escapeHtml(patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-')} | Gender: ${escapeHtml(patient.gender)}</div>
      <div class="muted">Address: ${escapeHtml(patient.address)}</div>
    </div>

    <div class="card">
      <h2>Assigned Doctor</h2>
      <div>${escapeHtml(doctor?.fullName || '-')}</div>
      <div class="muted">${escapeHtml(doctor?.specialty || '')} ${doctor?.department ? `| ${escapeHtml(doctor.department)}` : ''}</div>
      <div class="muted">${escapeHtml(doctor?.phone || '')} ${doctor?.email ? `| ${escapeHtml(doctor.email)}` : ''}</div>
    </div>

    <div class="card">
      <h2>Diagnoses (${diagnoses.length})</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>ICD</th><th>Severity</th><th>Description</th></tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" class="muted">No diagnoses found.</td></tr>'}
        </tbody>
      </table>
    </div>
  </body>
</html>`;

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDiagnosisReportJson, getDiagnosisReportHtml };

