const crypto = require('crypto');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const seededFloat01 = (seed, salt) => {
  const hash = crypto.createHash('sha256').update(`${seed}:${salt}`).digest();
  // Use first 6 bytes => 48 bits of entropy
  const intVal = hash.readUIntBE(0, 6);
  return intVal / 0x1000000000000;
};

const seededNormalish = (seed, salt, mean, spread) => {
  // Approximate a normal distribution by averaging a few uniforms
  const u1 = seededFloat01(seed, `${salt}:1`);
  const u2 = seededFloat01(seed, `${salt}:2`);
  const u3 = seededFloat01(seed, `${salt}:3`);
  const n = (u1 + u2 + u3) / 3;
  return mean + (n - 0.5) * 2 * spread;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const toISODate = (date) => date.toISOString().slice(0, 10);

const computeBmi = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  if (!heightM) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

const buildAllergies = (seed) => {
  const roll = seededFloat01(seed, 'allergies:roll');
  if (roll < 0.35) return [];

  const candidates = [
    { substance: 'Sulfonamides', reactions: ['Anaemia', 'Headache', 'Other'] },
    { substance: 'Penicillins', reactions: ['Rash', 'Urticaria'] },
    { substance: 'NSAIDs', reactions: ['Bronchospasm', 'Angioedema'] },
    { substance: 'Latex', reactions: ['Contact dermatitis'] }
  ];

  const index = Math.floor(seededFloat01(seed, 'allergies:index') * candidates.length);
  const second = Math.floor(seededFloat01(seed, 'allergies:index2') * candidates.length);
  const picked = [candidates[index]];
  if (seededFloat01(seed, 'allergies:second') > 0.6 && second !== index) picked.push(candidates[second]);
  return picked.slice(0, 2).map((a, idx) => ({
    id: `${seed}-alg-${idx}`,
    substance: a.substance,
    reactions: a.reactions,
    severity: seededFloat01(seed, `allergies:severity:${idx}`) > 0.7 ? 'high' : 'medium',
    notedAt: addDays(new Date(), -Math.floor(seededFloat01(seed, `allergies:days:${idx}`) * 700)).toISOString()
  }));
};

const buildFamilyHistory = (seed) => {
  const roll = seededFloat01(seed, 'family:roll');
  if (roll < 0.45) return [];
  const items = [
    { relation: 'Mother', condition: 'Type 2 diabetes mellitus', onsetAge: 52 },
    { relation: 'Father', condition: 'Hypertension', onsetAge: 46 },
    { relation: 'Sibling', condition: 'Asthma', onsetAge: 12 },
    { relation: 'Grandparent', condition: 'Ischemic heart disease', onsetAge: 61 }
  ];
  const count = 1 + Math.floor(seededFloat01(seed, 'family:count') * 2);
  return items
    .sort((a, b) => seededFloat01(seed, `family:sort:${a.relation}`) - seededFloat01(seed, `family:sort:${b.relation}`))
    .slice(0, count)
    .map((row, idx) => ({ id: `${seed}-fam-${idx}`, ...row }));
};

const buildAttachments = (seed, now) => {
  const roll = seededFloat01(seed, 'attachments:roll');
  if (roll < 0.25) return [];

  const candidates = [
    { name: 'Ultrasound_Report.pdf', type: 'PDF', sizeKb: 842 },
    { name: 'CBC_Lab_Results.pdf', type: 'PDF', sizeKb: 312 },
    { name: 'ECG_Image.png', type: 'Image', sizeKb: 224 },
    { name: 'Discharge_Summary.pdf', type: 'PDF', sizeKb: 156 }
  ];
  const count = 1 + Math.floor(seededFloat01(seed, 'attachments:count') * 2);
  return candidates
    .sort((a) => seededFloat01(seed, `attachments:sort:${a.name}`))
    .slice(0, count)
    .map((item, idx) => ({
      id: `${seed}-att-${idx}`,
      name: item.name,
      type: item.type,
      sizeKb: item.sizeKb,
      uploadedAt: addDays(now, -Math.floor(seededFloat01(seed, `attachments:days:${idx}`) * 30)).toISOString()
    }));
};

const buildVisits = (seed, now) => {
  const entries = [
    { type: 'Vitals', note: 'Vitals captured and reviewed.' },
    { type: 'Attachment Upload', note: 'New clinical attachment uploaded.' },
    { type: 'Consultation', note: 'Follow-up consultation visit.' }
  ];
  const count = 2 + Math.floor(seededFloat01(seed, 'visits:count') * 3);
  const daysBack = (idx) => Math.floor(seededFloat01(seed, `visits:days:${idx}`) * 45);
  return Array.from({ length: count }).map((_, idx) => {
    const entry = entries[Math.floor(seededFloat01(seed, `visits:type:${idx}`) * entries.length)];
    const at = addDays(now, -daysBack(idx));
    at.setHours(9 + Math.floor(seededFloat01(seed, `visits:hour:${idx}`) * 8), Math.floor(seededFloat01(seed, `visits:min:${idx}`) * 60), 0, 0);
    return { id: `${seed}-visit-${idx}`, occurredAt: at.toISOString(), ...entry };
  }).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
};

const buildAppointments = (seed, now) => {
  const roll = seededFloat01(seed, 'appts:roll');
  if (roll < 0.5) return [];

  const types = ['Prenatal check', 'Follow-up', 'Lab review', 'Vaccination'];
  const count = 1 + Math.floor(seededFloat01(seed, 'appts:count') * 2);
  return Array.from({ length: count }).map((_, idx) => {
    const dayOffset = 1 + Math.floor(seededFloat01(seed, `appts:day:${idx}`) * 21);
    const at = addDays(startOfDay(now), dayOffset);
    at.setHours(10 + Math.floor(seededFloat01(seed, `appts:hour:${idx}`) * 6), [0, 15, 30, 45][Math.floor(seededFloat01(seed, `appts:min:${idx}`) * 4)], 0, 0);
    return {
      id: `${seed}-appt-${idx}`,
      scheduledAt: at.toISOString(),
      status: seededFloat01(seed, `appts:status:${idx}`) > 0.85 ? 'cancelled' : 'scheduled',
      type: types[Math.floor(seededFloat01(seed, `appts:type:${idx}`) * types.length)],
      location: seededFloat01(seed, `appts:loc:${idx}`) > 0.5 ? 'Clinic A' : 'Clinic B'
    };
  }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
};

const buildClinicalFromPatient = (patient, diagnoses, now = new Date()) => {
  const seed = String(patient?._id || patient?.id || 'patient');

  const heightCm = clamp(Math.round(seededNormalish(seed, 'heightCm', 165, 10)), 145, 195);
  const baseWeight = clamp(Math.round(seededNormalish(seed, 'weightKg', 67, 16)), 42, 120);
  const baseHr = clamp(Math.round(seededNormalish(seed, 'pulse', 72, 18)), 52, 110);

  const vitalsDays = 14;
  const vitalsHistory = [];
  for (let i = vitalsDays - 1; i >= 0; i -= 1) {
    const day = addDays(startOfDay(now), -i);
    const weight = clamp(baseWeight + Math.round(seededNormalish(seed, `wt:${i}`, 0, 2)), 40, 140);
    const pulse = clamp(baseHr + Math.round(seededNormalish(seed, `hr:${i}`, 0, 8)), 45, 140);
    const tempC = clamp(Number((seededNormalish(seed, `temp:${i}`, 36.7, 0.4)).toFixed(1)), 35.5, 39.5);
    const systolic = clamp(Math.round(seededNormalish(seed, `sys:${i}`, 118, 14)), 85, 170);
    const diastolic = clamp(Math.round(seededNormalish(seed, `dia:${i}`, 76, 10)), 50, 110);
    const rr = clamp(Math.round(seededNormalish(seed, `rr:${i}`, 16, 4)), 10, 30);
    const spo2 = clamp(Math.round(seededNormalish(seed, `spo2:${i}`, 98, 2)), 90, 100);

    vitalsHistory.push({
      recordedAt: day.toISOString(),
      heightCm,
      weightKg: weight,
      bmi: computeBmi(weight, heightCm),
      temperatureC: tempC,
      pulse,
      respiratoryRate: rr,
      bloodPressure: { systolic, diastolic },
      spo2
    });
  }

  // Make "latest" look like a real capture time today.
  const latest = { ...vitalsHistory[vitalsHistory.length - 1] };
  const latestAt = new Date(now);
  latestAt.setHours(10, 8, 0, 0);
  latest.recordedAt = latestAt.toISOString();

  // Trend summary (compact table): last 7 days
  const trendSummary = vitalsHistory
    .slice(-7)
    .map((v) => ({ date: toISODate(new Date(v.recordedAt)), hr: v.pulse, tempC: v.temperatureC, weightKg: v.weightKg }))
    .reverse();

  // Conditions from diagnoses + a few synthetic chronic problems.
  const diagnosisConditions = diagnoses
    .slice(0, 4)
    .map((d) => ({
      id: String(d._id),
      label: d.description || d.icdCode || 'Diagnosis',
      icdCode: d.icdCode,
      status: 'active'
    }));

  const syntheticConditions = [];
  if (seededFloat01(seed, 'cond:preg') > 0.72 && patient.gender === 'female') {
    syntheticConditions.push({
      id: `${seed}-cond-hem`,
      label: 'Hemorrhage in early pregnancy',
      icdCode: 'O20.0',
      status: 'active'
    });
  }
  if (seededFloat01(seed, 'cond:htn') > 0.78) {
    syntheticConditions.push({
      id: `${seed}-cond-htn`,
      label: 'Essential (primary) hypertension',
      icdCode: 'I10',
      status: seededFloat01(seed, 'cond:htn:status') > 0.55 ? 'active' : 'history'
    });
  }

  const conditions = [...diagnosisConditions, ...syntheticConditions].slice(0, 6);

  const allergies = buildAllergies(seed);
  const familyHistory = buildFamilyHistory(seed);
  const attachments = buildAttachments(seed, now);
  const visits = buildVisits(seed, now);
  const appointments = buildAppointments(seed, now);

  return {
    latestVitals: latest,
    vitalsHistory,
    trendSummary,
    conditions,
    allergies,
    familyHistory,
    attachments,
    visits,
    appointments
  };
};

module.exports = {
  buildClinicalFromPatient
};

