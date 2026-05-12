const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const User = require('../models/User');

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalDoctors,
      totalPatients,
      totalDiagnoses,
      totalUsers,
      newPatientsThisMonth,
      diagnosesToday,
      diagnosesThisMonth,
      criticalDiagnoses,
      highDiagnoses,
      patientsWithoutDiagnoses,
      recentPatients,
      recentDiagnoses,
      riskDiagnoses,
      severityBreakdown,
      departmentLoad,
      doctorLoad,
      monthlyDiagnosisTrend,
      roleBreakdown
    ] =
      await Promise.all([
        Doctor.countDocuments(),
        Patient.countDocuments(),
        Diagnosis.countDocuments(),
        User.countDocuments(),
        Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Diagnosis.countDocuments({ diagnosedDate: { $gte: startOfToday, $lt: startOfTomorrow } }),
        Diagnosis.countDocuments({ diagnosedDate: { $gte: startOfMonth } }),
        Diagnosis.countDocuments({ severity: 'critical' }),
        Diagnosis.countDocuments({ severity: 'high' }),
        Patient.aggregate([
          {
            $lookup: {
              from: 'diagnoses',
              localField: '_id',
              foreignField: 'patient',
              as: 'diagnoses'
            }
          },
          { $match: { diagnoses: { $size: 0 } } },
          { $count: 'count' }
        ]),
        Patient.find().populate('assignedDoctor', 'fullName specialty department').sort({ createdAt: -1 }).limit(6),
        Diagnosis.find()
          .populate('patient', 'fullName')
          .populate('createdBy', 'name')
          .sort({ diagnosedDate: -1, createdAt: -1 })
          .limit(6),
        Diagnosis.find({ severity: { $in: ['critical', 'high'] } })
          .populate('patient', 'fullName phone')
          .populate('createdBy', 'name')
          .sort({ diagnosedDate: -1, createdAt: -1 })
          .limit(6),
        Diagnosis.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Patient.aggregate([
          {
            $lookup: {
              from: 'doctors',
              localField: 'assignedDoctor',
              foreignField: '_id',
              as: 'doctor'
            }
          },
          { $unwind: '$doctor' },
          { $group: { _id: '$doctor.department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 }
        ]),
        Patient.aggregate([
          {
            $lookup: {
              from: 'doctors',
              localField: 'assignedDoctor',
              foreignField: '_id',
              as: 'doctor'
            }
          },
          { $unwind: '$doctor' },
          { $group: { _id: '$doctor.fullName', specialty: { $first: '$doctor.specialty' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
        Diagnosis.aggregate([
          { $match: { diagnosedDate: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { year: { $year: '$diagnosedDate' }, month: { $month: '$diagnosedDate' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

    const severeDiagnoses = criticalDiagnoses + highDiagnoses;
    const diagnosedPatients = Math.max(totalPatients - (patientsWithoutDiagnoses[0]?.count || 0), 0);

    res.json({
      totalDoctors,
      totalPatients,
      totalDiagnoses,
      totalUsers,
      newPatientsThisMonth,
      diagnosesToday,
      diagnosesThisMonth,
      criticalDiagnoses,
      highDiagnoses,
      severeDiagnoses,
      patientsWithoutDiagnoses: patientsWithoutDiagnoses[0]?.count || 0,
      diagnosedPatients,
      averageDiagnosesPerPatient: totalPatients ? Number((totalDiagnoses / totalPatients).toFixed(1)) : 0,
      recentPatients,
      recentDiagnoses,
      riskDiagnoses,
      severityBreakdown,
      departmentLoad,
      doctorLoad,
      monthlyDiagnosisTrend,
      roleBreakdown
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
