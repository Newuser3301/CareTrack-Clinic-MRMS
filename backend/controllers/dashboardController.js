const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const User = require('../models/User');
const { getVisiblePatientFilter, isSystemManager } = require('../utils/rbac');

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const patientFilter = await getVisiblePatientFilter(req);
    const visiblePatientIds = await Patient.find(patientFilter).distinct('_id');
    const diagnosisFilter = { patient: { $in: visiblePatientIds } };
    const userFilter = isSystemManager(req.user) ? {} : { _id: req.user._id };
    const currentPatient = req.user.role === 'patient' ? await Patient.findOne({ user: req.user._id }) : null;
    const currentDoctor = req.user.role === 'doctor' ? await Doctor.findOne({ user: req.user._id }) : null;
    const doctorFilter = isSystemManager(req.user)
      ? {}
      : { _id: currentDoctor?._id || currentPatient?.assignedDoctor || null };

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
        Doctor.countDocuments(doctorFilter),
        Patient.countDocuments(patientFilter),
        Diagnosis.countDocuments(diagnosisFilter),
        User.countDocuments(userFilter),
        Patient.countDocuments({ ...patientFilter, createdAt: { $gte: startOfMonth } }),
        Diagnosis.countDocuments({ ...diagnosisFilter, diagnosedDate: { $gte: startOfToday, $lt: startOfTomorrow } }),
        Diagnosis.countDocuments({ ...diagnosisFilter, diagnosedDate: { $gte: startOfMonth } }),
        Diagnosis.countDocuments({ ...diagnosisFilter, severity: 'critical' }),
        Diagnosis.countDocuments({ ...diagnosisFilter, severity: 'high' }),
        Patient.aggregate([
          { $match: patientFilter },
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
        Patient.find(patientFilter).populate('assignedDoctor', 'fullName specialty department').sort({ createdAt: -1 }).limit(6),
        Diagnosis.find(diagnosisFilter)
          .populate('patient', 'fullName')
          .populate('createdBy', 'name')
          .sort({ diagnosedDate: -1, createdAt: -1 })
          .limit(6),
        Diagnosis.find({ ...diagnosisFilter, severity: { $in: ['critical', 'high'] } })
          .populate('patient', 'fullName phone')
          .populate('createdBy', 'name')
          .sort({ diagnosedDate: -1, createdAt: -1 })
          .limit(6),
        Diagnosis.aggregate([{ $match: diagnosisFilter }, { $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Patient.aggregate([
          { $match: patientFilter },
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
          { $match: patientFilter },
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
          { $match: { ...diagnosisFilter, diagnosedDate: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { year: { $year: '$diagnosedDate' }, month: { $month: '$diagnosedDate' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        User.aggregate([
          { $match: userFilter },
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
