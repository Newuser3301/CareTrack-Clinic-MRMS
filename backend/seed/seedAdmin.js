const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const RefreshSession = require('../models/RefreshSession');
const RevokedToken = require('../models/RevokedToken');
const AuditLog = require('../models/AuditLog');
const { bootstrapSuperAdmin } = require('../utils/bootstrapSuperAdmin');

dotenv.config();

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');

const doctorSeed = [
  ['Dr. Amina Karimova', 'Cardiology', 'Heart Care', 'Mon, Wed, Fri 09:00-15:00'],
  ['Dr. Timur Saidov', 'Endocrinology', 'Internal Medicine', 'Tue, Thu 10:00-17:00'],
  ['Dr. Laylo Nurmatova', 'Pediatrics', 'Family Health', 'Mon-Fri 08:00-13:00'],
  ['Dr. Rustam Qodirov', 'Neurology', 'Neuroscience', 'Mon, Thu 12:00-18:00'],
  ['Dr. Malika Usmonova', 'Dermatology', 'Skin Health', 'Tue, Wed, Fri 09:00-14:00'],
  ['Dr. Sherzod Alimuhamedov', 'Pulmonology', 'Respiratory Care', 'Mon-Fri 10:00-16:00'],
  ['Dr. Nodira Yusupova', 'Gynecology', 'Women Health', 'Mon, Tue, Thu 09:00-16:00'],
  ['Dr. Bekzod Kamilov', 'Orthopedics', 'Bone and Joint', 'Wed-Sat 08:30-15:30'],
  ['Dr. Shahnoza Ergasheva', 'Ophthalmology', 'Vision Center', 'Mon-Fri 09:30-17:30'],
  ['Dr. Daler Mirzayev', 'Gastroenterology', 'Digestive Health', 'Tue-Sat 10:00-18:00'],
  ['Dr. Mohira Tursunova', 'Nephrology', 'Kidney Care', 'Mon, Wed, Fri 08:00-14:00'],
  ['Dr. Javlon Sattorov', 'General Practice', 'Primary Care', 'Daily 08:00-20:00']
];

const patientSeed = [
  ['Aziz Rahmonov', '1984-04-18', 'male'],
  ['Madina Ismoilova', '1991-09-03', 'female'],
  ['Sofia Bekmurodova', '2016-01-25', 'female'],
  ['Jasur Tursunov', '1978-11-09', 'male'],
  ['Gulnoza Abdullaeva', '1989-06-14', 'female'],
  ['Oybek Nazarov', '1965-02-27', 'male'],
  ['Nilufar Sobirova', '2002-12-08', 'female'],
  ['Sardor Komilov', '1995-05-30', 'male'],
  ['Mohira Erkinova', '1972-03-11', 'female'],
  ['Anvar Akhmedov', '1981-07-23', 'male'],
  ['Dildora Rakhimova', '1993-08-19', 'female'],
  ['Kamron Fayziyev', '1987-12-02', 'male'],
  ['Sevinch Kholmatova', '2000-05-15', 'female'],
  ['Ulugbek Ganiev', '1975-10-28', 'male'],
  ['Shahzoda Turaeva', '1998-03-07', 'female'],
  ['Bobur Xasanov', '1983-06-30', 'male'],
  ['Nargiza Mamatqulova', '1990-01-11', 'female'],
  ['Temur Beknazarov', '1969-09-24', 'male'],
  ['Malika Kadirova', '1986-11-05', 'female'],
  ['Firdavs Hamroyev', '1997-02-18', 'male'],
  ['Dilnoza Sulaymonova', '1979-07-27', 'female'],
  ['Akbar Rajabov', '1988-04-09', 'male'],
  ['Zarina Rasulova', '2001-10-13', 'female'],
  ['Sherzod Ibragimov', '1974-12-21', 'male'],
  ['Nodira Qosimova', '1994-02-01', 'female'],
  ['Javohir Normatov', '1982-05-12', 'male'],
  ['Lola Alimuhamedova', '1996-09-29', 'female'],
  ['Miraziz Shukurov', '2003-03-16', 'male'],
  ['Farangiz Qurbanova', '1985-06-08', 'female'],
  ['Murodjon Yuldashev', '1971-01-20', 'male'],
  ['Ozoda Ergasheva', '1999-08-04', 'female'],
  ['Asilbek Ruzimuhamedov', '1992-11-17', 'male'],
  ['Munisa Olimova', '1980-04-26', 'female'],
  ['Suhrob Tolipov', '1967-07-14', 'male'],
  ['Nigora Abdusamatova', '1995-12-10', 'female'],
  ['Beknur Teshayev', '2004-02-22', 'male']
];

const streets = [
  'Navoi Street',
  'Amir Temur Avenue',
  'Beruniy Road',
  'Bobur Street',
  'Buyuk Ipak Yuli',
  'Parkent Street',
  'Mustaqillik Avenue',
  'Chilanzar Avenue',
  'Fargona Yoli',
  'Qatortol Street',
  'Yunusobod Boulevard',
  'Shota Rustaveli Street'
];

const districts = ['Tashkent', 'Samarqand', 'Andijon', 'Namangan', 'Fargona', 'Buxoro'];
const emergencyNames = ['Malika', 'Sardor', 'Nodira', 'Dilorom', 'Umid', 'Shahlo', 'Zarina', 'Dilshod', 'Ravshan', 'Sevara', 'Aziza', 'Javlon'];

const doctorProfiles = doctorSeed.map(([fullName, specialty, department, availability], index) => [
  fullName,
  specialty,
  department,
  `+998 90 ${String(111 + index * 7).padStart(3, '0')} ${String(20 + index).padStart(2, '0')} ${String(31 + index).padStart(2, '0')}`,
  `${slugify(fullName.replace(/^dr\.\s*/i, ''))}@caretrack.com`,
  availability
]);

const patientProfiles = patientSeed.map(([fullName, dateOfBirth, gender], index) => {
  const surname = fullName.split(' ').slice(-1)[0];
  const emergencyName = emergencyNames[index % emergencyNames.length];
  return [
    fullName,
    dateOfBirth,
    gender,
    `+998 ${90 + (index % 9)} ${String(200 + index * 3).padStart(3, '0')} ${String(10 + index).padStart(2, '0')} ${String(20 + index).padStart(2, '0')}`,
    `${slugify(fullName)}@example.com`,
    `${10 + (index % 60)} ${streets[index % streets.length]}, ${districts[index % districts.length]}`,
    `${emergencyName} ${surname}, +998 ${91 + (index % 8)} ${String(300 + index * 2).padStart(3, '0')} ${String(30 + index).padStart(2, '0')} ${String(40 + index).padStart(2, '0')}`
  ];
});

const diagnosisTemplates = [
  ['I10', 'Essential primary hypertension', 'medium', 'Blood pressure monitoring and medication adherence review planned.'],
  ['E11.9', 'Type 2 diabetes mellitus without complications', 'high', 'Nutrition counselling, glucose diary, and laboratory follow-up scheduled.'],
  ['J06.9', 'Acute upper respiratory infection, unspecified', 'low', 'Supportive care instructions, fluids, and return precautions provided.'],
  ['G43.9', 'Migraine, unspecified', 'medium', 'Headache trigger diary recommended and treatment response to be tracked.'],
  ['J45.909', 'Unspecified asthma, uncomplicated', 'high', 'Inhaler technique reviewed and spirometry follow-up requested.'],
  ['I21.9', 'Acute myocardial infarction, unspecified', 'critical', 'Urgent cardiology escalation and admission protocol initiated.'],
  ['N18.9', 'Chronic kidney disease, unspecified', 'medium', 'Renal function follow-up and hydration guidance documented.'],
  ['K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'low', 'Meal timing, trigger foods, and acid suppression plan reviewed.'],
  ['M54.5', 'Low back pain', 'medium', 'Home exercise plan and posture adjustments added to care note.'],
  ['H52.4', 'Presbyopia', 'low', 'Visual strain counselling and follow-up screening suggested.']
];

const diagnosisDate = (index, offset = 0) => {
  const date = new Date();
  date.setHours(9 + ((index + offset) % 8), 15 * ((index + offset) % 4), 0, 0);
  date.setDate(date.getDate() - ((index * 3 + offset) % 120));
  return date;
};

const seedDatabase = async ({ reset = true, connect = false } = {}) => {
  if (connect) await connectDB();

  if (!reset && (await User.countDocuments()) > 0) {
    console.log('Seed skipped: database already contains users');
    return { skipped: true };
  }

  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Diagnosis.deleteMany({}),
      RefreshSession.deleteMany({}),
      RevokedToken.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
  }

  const superAdminResult = await bootstrapSuperAdmin();
  const superAdmin = superAdminResult.skipped ? null : await User.findById(superAdminResult.userId);

  const doctors = [];
  for (const [fullName, specialty, department, phone, email, availability] of doctorProfiles) {
    const user = await User.create({ name: fullName, email, password: 'Doctor12345!', role: 'doctor' });
    doctors.push(await Doctor.create({ user: user._id, fullName, specialty, department, phone, email, availability }));
  }

  const patients = [];
  for (const [fullName, dateOfBirth, gender, phone, email, address, emergencyContact] of patientProfiles) {
    const index = patients.length;
    const user = await User.create({ name: fullName, email, password: 'Patient12345!', role: 'patient' });
    patients.push(
      await Patient.create({
        user: user._id,
        fullName,
        dateOfBirth,
        gender,
        phone,
        email,
        address,
        assignedDoctor: doctors[index % doctors.length]._id,
        emergencyContact
      })
    );
  }

  const diagnosisCreators = [superAdmin, ...(await User.find({ role: 'doctor' }))].filter(Boolean);
  const diagnoses = [];

  patients.forEach((patient, index) => {
    const primary = diagnosisTemplates[index % diagnosisTemplates.length];
    const secondary = diagnosisTemplates[(index + 3) % diagnosisTemplates.length];

    diagnoses.push({
      patient: patient._id,
      icdCode: primary[0],
      description: primary[1],
      severity: primary[2],
      notes: primary[3],
      diagnosedDate: diagnosisDate(index),
      createdBy: diagnosisCreators[index % diagnosisCreators.length]._id
    });

    diagnoses.push({
      patient: patient._id,
      icdCode: secondary[0],
      description: secondary[1],
      severity: secondary[2],
      notes: secondary[3],
      diagnosedDate: diagnosisDate(index, 5),
      createdBy: diagnosisCreators[(index + 1) % diagnosisCreators.length]._id
    });

    if (index % 3 === 0) {
      const tertiary = diagnosisTemplates[(index + 6) % diagnosisTemplates.length];
      diagnoses.push({
        patient: patient._id,
        icdCode: tertiary[0],
        description: tertiary[1],
        severity: tertiary[2],
        notes: tertiary[3],
        diagnosedDate: diagnosisDate(index, 9),
        createdBy: diagnosisCreators[(index + 2) % diagnosisCreators.length]._id
      });
    }
  });

  await Diagnosis.insertMany(diagnoses);

  const totalUsers = await User.countDocuments();

  console.log('Seed complete');
  console.log(`Users: ${totalUsers}, Doctors: ${doctors.length}, Patients: ${patients.length}, Diagnoses: ${diagnoses.length}`);
  if (superAdmin) {
    console.log(`System Admin: ${superAdmin.email} / [env password]`);
  } else {
    console.log('System Admin: not created because SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are missing');
  }
  console.log(`Doctor: ${doctorProfiles[0][4]} / Doctor12345!`);
  console.log(`Patient: ${patientProfiles[0][4]} / Patient12345!`);

  return {
    skipped: false,
    users: totalUsers,
    doctors: doctors.length,
    patients: patients.length,
    diagnoses: diagnoses.length
  };
};

if (require.main === module) {
  seedDatabase({ reset: true, connect: true })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
