const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const RefreshSession = require('../models/RefreshSession');
const RevokedToken = require('../models/RevokedToken');
const AuditLog = require('../models/AuditLog');

dotenv.config();

const doctorProfiles = [
  ['Dr. Amina Karimova', 'Cardiology', 'Heart Care', '+998 90 111 22 33', 'amina.karimova@caretrack.com', 'Mon, Wed, Fri 09:00-15:00'],
  ['Dr. Timur Saidov', 'Endocrinology', 'Internal Medicine', '+998 90 222 33 44', 'timur.saidov@caretrack.com', 'Tue, Thu 10:00-17:00'],
  ['Dr. Laylo Nurmatova', 'Pediatrics', 'Family Health', '+998 90 333 44 55', 'laylo.nurmatova@caretrack.com', 'Mon-Fri 08:00-13:00'],
  ['Dr. Rustam Qodirov', 'Neurology', 'Neuroscience', '+998 90 444 55 66', 'rustam.qodirov@caretrack.com', 'Mon, Thu 12:00-18:00'],
  ['Dr. Malika Usmonova', 'Dermatology', 'Skin Health', '+998 90 555 66 77', 'malika.usmonova@caretrack.com', 'Tue, Wed, Fri 09:00-14:00']
];

const patientProfiles = [
  ['Aziz Rahmonov', '1984-04-18', 'male', '+998 91 444 55 66', 'aziz.rahmonov@example.com', '12 Navoi Street, Tashkent', 'Malika Rahmonova, +998 91 444 55 77'],
  ['Madina Ismoilova', '1991-09-03', 'female', '+998 93 555 66 77', 'madina.ismoilova@example.com', '8 Amir Temur Avenue, Tashkent', 'Sardor Ismoilov, +998 93 555 66 88'],
  ['Sofia Bekmurodova', '2016-01-25', 'female', '+998 94 666 77 88', 'sofia.bekmurodova@example.com', '44 Beruniy Road, Tashkent', 'Nodira Bekmurodova, +998 94 666 77 99'],
  ['Jasur Tursunov', '1978-11-09', 'male', '+998 95 111 22 33', 'jasur.tursunov@example.com', '18 Bobur Street, Tashkent', 'Dilorom Tursunova, +998 95 111 22 44'],
  ['Gulnoza Abdullaeva', '1989-06-14', 'female', '+998 97 222 33 44', 'gulnoza.abdullaeva@example.com', '22 Chilanzar District, Tashkent', 'Umid Abdullaev, +998 97 222 33 55'],
  ['Oybek Nazarov', '1965-02-27', 'male', '+998 98 333 44 55', 'oybek.nazarov@example.com', '5 Yunusabad Block 7, Tashkent', 'Shahlo Nazarova, +998 98 333 44 66'],
  ['Nilufar Sobirova', '2002-12-08', 'female', '+998 99 444 55 66', 'nilufar.sobirova@example.com', '31 Buyuk Ipak Yuli, Tashkent', 'Zarina Sobirova, +998 99 444 55 77'],
  ['Sardor Komilov', '1995-05-30', 'male', '+998 90 555 66 77', 'sardor.komilov@example.com', '77 Parkent Street, Tashkent', 'Dilshod Komilov, +998 90 555 66 88'],
  ['Mohira Erkinova', '1972-03-11', 'female', '+998 91 666 77 88', 'mohira.erkinova@example.com', '3 Mustaqillik Avenue, Tashkent', 'Ravshan Erkinov, +998 91 666 77 99'],
  ['Anvar Akhmedov', '1981-07-23', 'male', '+998 93 777 88 99', 'anvar.akhmedov@example.com', '14 Fargona Yoli, Tashkent', 'Sevara Akhmedova, +998 93 777 88 00']
];

const diagnosisTemplates = [
  ['I10', 'Essential primary hypertension', 'medium', 'BP average 148/92 mmHg. Continue ACE inhibitor and daily BP log.'],
  ['E11.9', 'Type 2 diabetes mellitus without complications', 'high', 'HbA1c 8.1%. Nutrition counselling booked and labs planned.'],
  ['J06.9', 'Acute upper respiratory infection, unspecified', 'low', 'Supportive care, hydration, and return precautions provided.'],
  ['G43.9', 'Migraine, unspecified', 'medium', 'Trigger diary recommended and medication response to be reviewed.'],
  ['J45.909', 'Unspecified asthma, uncomplicated', 'high', 'Inhaler technique reviewed and spirometry ordered.'],
  ['I21.9', 'Acute myocardial infarction, unspecified', 'critical', 'Emergency cardiology transfer arranged.']
];

const diagnosisDate = (index, offset = 0) => {
  const date = new Date();
  date.setHours(9 + ((index + offset) % 8), 0, 0, 0);
  date.setDate(date.getDate() - ((index * 4 + offset) % 90));
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

  const superAdmin = await User.create({
    name: 'Islomiddin Habibullayev',
    email: 'superadmin@caretrack.com',
    password: 'SuperAdmin12345!',
    role: 'super_admin'
  });

  const admins = await User.create([
    { name: 'Zarina Abdullaeva', email: 'admin@caretrack.com', password: 'Admin12345!', role: 'admin' },
    { name: 'Kamoliddin Rasulov', email: 'operations.admin@caretrack.com', password: 'Admin12345!', role: 'admin' }
  ]);

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

  const diagnosisCreators = [superAdmin, ...admins, ...(await User.find({ role: 'doctor' }))];
  const diagnoses = [];
  patients.forEach((patient, index) => {
    const primary = diagnosisTemplates[index % diagnosisTemplates.length];
    diagnoses.push({
      patient: patient._id,
      icdCode: primary[0],
      description: primary[1],
      severity: primary[2],
      notes: primary[3],
      diagnosedDate: diagnosisDate(index),
      createdBy: diagnosisCreators[index % diagnosisCreators.length]._id
    });

    if (index % 2 === 0) {
      const secondary = diagnosisTemplates[(index + 2) % diagnosisTemplates.length];
      diagnoses.push({
        patient: patient._id,
        icdCode: secondary[0],
        description: secondary[1],
        severity: secondary[2],
        notes: secondary[3],
        diagnosedDate: diagnosisDate(index, 6),
        createdBy: diagnosisCreators[(index + 1) % diagnosisCreators.length]._id
      });
    }
  });

  await Diagnosis.insertMany(diagnoses);

  console.log('Seed complete');
  console.log(`Users: ${await User.countDocuments()}, Doctors: ${doctors.length}, Patients: ${patients.length}, Diagnoses: ${diagnoses.length}`);
  console.log('Super Admin: superadmin@caretrack.com / SuperAdmin12345!');
  console.log('Admin: admin@caretrack.com / Admin12345!');
  console.log('Doctor: amina.karimova@caretrack.com / Doctor12345!');
  console.log('Patient: aziz.rahmonov@example.com / Patient12345!');

  return {
    skipped: false,
    users: await User.countDocuments(),
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
