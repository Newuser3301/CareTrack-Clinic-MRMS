const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');

dotenv.config();

const users = [
  { name: 'Islomiddin Habibullayev', email: 'admin@caretrack.com', password: 'Admin12345', role: 'admin' },
  { name: 'Dr. Sherzod Karimov', email: 'clinician@caretrack.com', password: 'Clinician12345', role: 'clinician' },
  { name: 'Mohira Valieva', email: 'reception@caretrack.com', password: 'Reception12345', role: 'receptionist' },
  { name: 'Dr. Nodir Akramov', email: 'nodir.akramov@caretrack.com', password: 'Clinician12345', role: 'clinician' },
  { name: 'Dr. Saida Hamidova', email: 'saida.hamidova@caretrack.com', password: 'Clinician12345', role: 'clinician' },
  { name: 'Dilorom Qodirova', email: 'frontdesk.east@caretrack.com', password: 'Reception12345', role: 'receptionist' },
  { name: 'Kamoliddin Rasulov', email: 'supervisor@caretrack.com', password: 'Admin12345', role: 'admin' }
];

const doctorsSeed = [
  ['Dr. Amina Karimova', 'Cardiology', 'Heart Care', '+998 90 111 22 33', 'amina.karimova@caretrack.com', 'Mon, Wed, Fri 09:00-15:00'],
  ['Dr. Timur Saidov', 'Endocrinology', 'Internal Medicine', '+998 90 222 33 44', 'timur.saidov@caretrack.com', 'Tue, Thu 10:00-17:00'],
  ['Dr. Laylo Nurmatova', 'Pediatrics', 'Family Health', '+998 90 333 44 55', 'laylo.nurmatova@caretrack.com', 'Mon-Fri 08:00-13:00'],
  ['Dr. Rustam Qodirov', 'Neurology', 'Neuroscience', '+998 90 444 55 66', 'rustam.qodirov@caretrack.com', 'Mon, Thu 12:00-18:00'],
  ['Dr. Malika Usmonova', 'Dermatology', 'Skin Health', '+998 90 555 66 77', 'malika.usmonova@caretrack.com', 'Tue, Wed, Fri 09:00-14:00'],
  ['Dr. Behzod Aliyev', 'Orthopedics', 'Rehabilitation', '+998 90 666 77 88', 'behzod.aliyev@caretrack.com', 'Mon-Fri 14:00-19:00'],
  ['Dr. Dilnoza Mirzaeva', 'Pulmonology', 'Respiratory Care', '+998 90 777 88 99', 'dilnoza.mirzaeva@caretrack.com', 'Mon, Wed 10:00-16:00'],
  ['Dr. Sardor Ergashev', 'Gastroenterology', 'Digestive Health', '+998 90 888 99 00', 'sardor.ergashev@caretrack.com', 'Tue, Thu, Sat 09:00-13:00'],
  ['Dr. Kamola Rakhimova', 'Obstetrics and Gynecology', 'Women Health', '+998 91 101 20 30', 'kamola.rakhimova@caretrack.com', 'Mon-Fri 09:30-15:30'],
  ['Dr. Javlon Ismatov', 'Ophthalmology', 'Eye Clinic', '+998 91 202 30 40', 'javlon.ismatov@caretrack.com', 'Wed, Fri 11:00-18:00'],
  ['Dr. Feruza Olimova', 'ENT', 'Head and Neck Care', '+998 91 303 40 50', 'feruza.olimova@caretrack.com', 'Mon, Tue, Thu 08:30-13:30'],
  ['Dr. Akmal Yusupov', 'Psychiatry', 'Behavioral Health', '+998 91 404 50 60', 'akmal.yusupov@caretrack.com', 'Tue, Fri 13:00-18:00']
].map(([fullName, specialty, department, phone, email, availability]) => ({
  fullName,
  specialty,
  department,
  phone,
  email,
  availability
}));

const patientNames = [
  ['Aziz Rahmonov', '1984-04-18', 'male', '+998 91 444 55 66', '12 Navoi Street, Tashkent', 'Malika Rahmonova, +998 91 444 55 77'],
  ['Madina Ismoilova', '1991-09-03', 'female', '+998 93 555 66 77', '8 Amir Temur Avenue, Tashkent', 'Sardor Ismoilov, +998 93 555 66 88'],
  ['Sofia Bekmurodova', '2016-01-25', 'female', '+998 94 666 77 88', '44 Beruniy Road, Tashkent', 'Nodira Bekmurodova, +998 94 666 77 99'],
  ['Jasur Tursunov', '1978-11-09', 'male', '+998 95 111 22 33', '18 Bobur Street, Tashkent', 'Dilorom Tursunova, +998 95 111 22 44'],
  ['Gulnoza Abdullaeva', '1989-06-14', 'female', '+998 97 222 33 44', '22 Chilanzar District, Tashkent', 'Umid Abdullaev, +998 97 222 33 55'],
  ['Oybek Nazarov', '1965-02-27', 'male', '+998 98 333 44 55', '5 Yunusabad Block 7, Tashkent', 'Shahlo Nazarova, +998 98 333 44 66'],
  ['Nilufar Sobirova', '2002-12-08', 'female', '+998 99 444 55 66', '31 Buyuk Ipak Yuli, Tashkent', 'Zarina Sobirova, +998 99 444 55 77'],
  ['Sardor Komilov', '1995-05-30', 'male', '+998 90 555 66 77', '77 Parkent Street, Tashkent', 'Dilshod Komilov, +998 90 555 66 88'],
  ['Mohira Erkinova', '1972-03-11', 'female', '+998 91 666 77 88', '3 Mustaqillik Avenue, Tashkent', 'Ravshan Erkinov, +998 91 666 77 99'],
  ['Anvar Akhmedov', '1981-07-23', 'male', '+998 93 777 88 99', '14 Fargona Yoli, Tashkent', 'Sevara Akhmedova, +998 93 777 88 00'],
  ['Lola Matkarimova', '1999-10-19', 'female', '+998 94 888 99 00', '50 Shota Rustaveli, Tashkent', 'Aziza Matkarimova, +998 94 888 99 11'],
  ['Doston Isroilov', '2011-08-04', 'male', '+998 95 999 00 11', '6 Sergeli District, Tashkent', 'Murod Isroilov, +998 95 999 00 22'],
  ['Shahnoza Muminova', '1958-01-16', 'female', '+998 97 101 11 12', '91 Karasaray Street, Tashkent', 'Bahrom Muminov, +998 97 101 11 13'],
  ['Bekzod Raufov', '1987-09-28', 'male', '+998 98 202 22 23', '27 Qorasuv Block, Tashkent', 'Sitora Raufova, +998 98 202 22 24'],
  ['Munisa Karimova', '2007-04-07', 'female', '+998 99 303 33 34', '11 Nukus Street, Tashkent', 'Amina Karimova, +998 99 303 33 35'],
  ['Alisher Ubaydullaev', '1970-12-13', 'male', '+998 90 404 44 45', '2 Bunyodkor Avenue, Tashkent', 'Mavluda Ubaydullaeva, +998 90 404 44 46'],
  ['Ziyoda Rasulova', '1993-02-05', 'female', '+998 91 505 55 56', '19 Abdulla Qodiriy, Tashkent', 'Sherzod Rasulov, +998 91 505 55 57'],
  ['Ibrohim Kholmatov', '1980-06-21', 'male', '+998 93 606 66 67', '45 Niyozbek Yoli, Tashkent', 'Nasiba Kholmatova, +998 93 606 66 68'],
  ['Sevinch Akbarova', '2018-09-17', 'female', '+998 94 707 77 78', '23 Mirzo Ulugbek, Tashkent', 'Gavhar Akbarova, +998 94 707 77 79'],
  ['Ulugbek Toirov', '1962-05-02', 'male', '+998 95 808 88 89', '10 Olmazor District, Tashkent', 'Nargiza Toirova, +998 95 808 88 90'],
  ['Rano Jalilova', '1976-11-29', 'female', '+998 97 909 99 90', '66 Yakkasaray Street, Tashkent', 'Oybek Jalilov, +998 97 909 99 91'],
  ['Farrukh Pulatov', '1990-03-22', 'male', '+998 98 010 10 11', '38 Mirobod District, Tashkent', 'Madina Pulatova, +998 98 010 10 12'],
  ['Dilorom Safarova', '1983-08-15', 'female', '+998 99 121 21 22', '29 Uchtepa District, Tashkent', 'Sanjar Safarov, +998 99 121 21 23'],
  ['Akbar Nishonov', '1955-07-06', 'male', '+998 90 232 32 33', '17 Labzak Street, Tashkent', 'Lobar Nishonova, +998 90 232 32 34'],
  ['Nargiza Ochilova', '2000-01-31', 'female', '+998 91 343 43 44', '83 Sebzor Street, Tashkent', 'Jahongir Ochilov, +998 91 343 43 45'],
  ['Sarvar Yoqubov', '1974-04-26', 'male', '+998 93 454 54 55', '4 Chorsu Area, Tashkent', 'Feruza Yoqubova, +998 93 454 54 56'],
  ['Madinabonu Hamroeva', '2014-10-01', 'female', '+998 94 565 65 66', '26 Qibray Road, Tashkent', 'Jamila Hamroeva, +998 94 565 65 67'],
  ['Bobur Shokirov', '1986-12-20', 'male', '+998 95 676 76 77', '72 Minor Street, Tashkent', 'Dilfuza Shokirova, +998 95 676 76 78'],
  ['Shirin Umarova', '1996-06-18', 'female', '+998 97 787 87 88', '51 Afrosiyob Street, Tashkent', 'Komil Umarov, +998 97 787 87 89'],
  ['Temur Haydarov', '1968-02-12', 'male', '+998 98 898 98 99', '9 Bodomzor Road, Tashkent', 'Laziza Haydarova, +998 98 898 98 00']
];

const diagnosisTemplates = [
  ['I10', 'Essential primary hypertension', 'medium', 'BP average 148/92 mmHg. Continue ACE inhibitor, daily BP log, low-salt diet, review in 14 days.'],
  ['E11.9', 'Type 2 diabetes mellitus without complications', 'high', 'HbA1c 8.1%. Metformin adherence reviewed, nutrition counselling booked, repeat labs in 8 weeks.'],
  ['J06.9', 'Acute upper respiratory infection, unspecified', 'low', 'Afebrile at visit. Supportive care, hydration, and return precautions provided.'],
  ['G43.9', 'Migraine, unspecified', 'medium', 'Two attacks this month. Trigger diary recommended and acute medication response to be reviewed.'],
  ['L20.9', 'Atopic dermatitis, unspecified', 'low', 'Dry plaques on forearms. Topical therapy prescribed and skin care education completed.'],
  ['M54.5', 'Low back pain', 'medium', 'No red flags. Physical therapy referral, home exercises, and ergonomic advice provided.'],
  ['J45.909', 'Unspecified asthma, uncomplicated', 'high', 'Night symptoms reported twice weekly. Inhaler technique reviewed, spirometry ordered.'],
  ['K21.9', 'Gastro-esophageal reflux disease without esophagitis', 'medium', 'Post-meal reflux. Diet modifications, PPI trial, and follow-up in four weeks.'],
  ['H52.1', 'Myopia', 'low', 'Visual acuity changed since last visit. Refraction update and ophthalmology follow-up recommended.'],
  ['F41.1', 'Generalized anxiety disorder', 'medium', 'GAD-7 score documented. Counselling referral discussed with follow-up visit scheduled.'],
  ['I21.9', 'Acute myocardial infarction, unspecified', 'critical', 'Chest pain protocol activated. ECG changes documented and emergency cardiology transfer arranged.'],
  ['E10.65', 'Type 1 diabetes mellitus with hyperglycemia', 'critical', 'Marked hyperglycemia with ketone risk. Urgent glucose management plan initiated.'],
  ['J18.9', 'Pneumonia, unspecified organism', 'high', 'Cough, fever, and focal crackles. Antibiotic therapy and respiratory follow-up arranged.'],
  ['N39.0', 'Urinary tract infection, site not specified', 'medium', 'Dysuria and positive urine dipstick. Culture ordered and empiric therapy started.'],
  ['D50.9', 'Iron deficiency anemia, unspecified', 'medium', 'CBC shows microcytic anemia. Iron replacement plan and dietary advice documented.']
];

const diagnosisDate = (index, offset = 0) => {
  const date = new Date();
  date.setHours(9 + ((index + offset) % 8), 0, 0, 0);
  date.setDate(date.getDate() - ((index * 4 + offset) % 120));
  return date;
};

const seedDatabase = async ({ reset = true, connect = false } = {}) => {
  if (connect) await connectDB();

  if (!reset) {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Seed skipped: database already contains users');
      return { skipped: true };
    }
  }

  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Diagnosis.deleteMany({})
    ]);
  }

  const createdUsers = await Promise.all(users.map((user) => User.create(user)));
  const clinicalUsers = createdUsers.filter((user) => ['admin', 'clinician'].includes(user.role));
  const doctors = await Doctor.insertMany(doctorsSeed);

  const patients = await Patient.insertMany(
    patientNames.map(([fullName, dateOfBirth, gender, phone, address, emergencyContact], index) => ({
      fullName,
      dateOfBirth,
      gender,
      phone,
      address,
      assignedDoctor: doctors[index % doctors.length]._id,
      emergencyContact
    }))
  );

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
      createdBy: clinicalUsers[index % clinicalUsers.length]._id
    });

    if (index % 2 === 0) {
      const secondary = diagnosisTemplates[(index + 5) % diagnosisTemplates.length];
      diagnoses.push({
        patient: patient._id,
        icdCode: secondary[0],
        description: secondary[1],
        severity: secondary[2],
        notes: secondary[3],
        diagnosedDate: diagnosisDate(index, 6),
        createdBy: clinicalUsers[(index + 1) % clinicalUsers.length]._id
      });
    }
  });

  await Diagnosis.insertMany(diagnoses);

  console.log('Seed complete');
  console.log(`Users: ${createdUsers.length}, Doctors: ${doctors.length}, Patients: ${patients.length}, Diagnoses: ${diagnoses.length}`);
  console.log('Admin: admin@caretrack.com / Admin12345');
  console.log('Clinician: clinician@caretrack.com / Clinician12345');
  console.log('Receptionist: reception@caretrack.com / Reception12345');
  return {
    skipped: false,
    users: createdUsers.length,
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
