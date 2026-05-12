import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, ClipboardList, ShieldCheck, Stethoscope, TrendingUp, UserPlus, UserRound, Users } from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Loader from '../components/Loader';

const StatCard = ({ label, value, helper, icon: Icon, tone }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        {helper && <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${tone}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const ProgressRow = ({ label, value, max, tone = 'bg-primary-600', helper }) => {
  const width = max ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{helper || value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard.'));
  }, []);

  const severityMap = useMemo(() => {
    if (!stats) return {};
    return stats.severityBreakdown.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
  }, [stats]);

  const monthLabel = (item) =>
    new Date(item._id.year, item._id.month - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!stats) return <Loader />;

  const maxSeverity = Math.max(...stats.severityBreakdown.map((item) => item.count), 1);
  const maxDepartment = Math.max(...stats.departmentLoad.map((item) => item.count), 1);
  const maxDoctorLoad = Math.max(...stats.doctorLoad.map((item) => item.count), 1);
  const maxMonthlyTrend = Math.max(...stats.monthlyDiagnosisTrend.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">CareTrack Clinic</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Clinical Operations Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Live overview of provider capacity, patient registrations, diagnosis activity, risk cases, and clinic workload.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-md bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-700">{stats.criticalDiagnoses}</p>
            </div>
            <div className="rounded-md bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-amber-700">High + Critical</p>
              <p className="text-2xl font-bold text-amber-700">{stats.severeDiagnoses}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doctors" value={stats.totalDoctors} helper="Active providers" icon={Stethoscope} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Patients" value={stats.totalPatients} helper="Registered records" icon={UserRound} tone="bg-green-50 text-green-700" />
        <StatCard label="Diagnoses" value={stats.totalDiagnoses} helper="Linked clinical entries" icon={ClipboardList} tone="bg-cyan-50 text-cyan-700" />
        <StatCard label="Users" value={stats.totalUsers} helper="System accounts" icon={Users} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New Patients" value={stats.newPatientsThisMonth} helper="Registered this month" icon={UserPlus} tone="bg-violet-50 text-violet-700" />
        <StatCard label="Today's Diagnoses" value={stats.diagnosesToday} helper="Diagnosed today" icon={CalendarDays} tone="bg-indigo-50 text-indigo-700" />
        <StatCard label="Monthly Diagnoses" value={stats.diagnosesThisMonth} helper="Diagnosed this month" icon={Activity} tone="bg-teal-50 text-teal-700" />
        <StatCard label="Diagnosis Coverage" value={`${stats.diagnosedPatients}/${stats.totalPatients}`} helper={`${stats.patientsWithoutDiagnoses} patients without diagnoses`} icon={TrendingUp} tone="bg-rose-50 text-rose-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Diagnosis Severity</h2>
              <p className="text-sm text-slate-500">Current distribution across all diagnosis records.</p>
            </div>
            <ShieldCheck className="text-green-600" size={22} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {['critical', 'high', 'medium', 'low'].map((severity) => (
              <ProgressRow
                key={severity}
                label={severity}
                value={severityMap[severity] || 0}
                max={maxSeverity}
                tone={{
                  critical: 'bg-red-600',
                  high: 'bg-amber-500',
                  medium: 'bg-blue-600',
                  low: 'bg-green-600'
                }[severity]}
                helper={`${severityMap[severity] || 0} cases`}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Risk Watch</h2>
              <p className="text-sm text-slate-500">Cases needing close attention.</p>
            </div>
            <AlertTriangle className="text-amber-600" size={22} />
          </div>
          <div className="mt-5 space-y-3">
            {stats.riskDiagnoses.map((diagnosis) => (
                <div key={diagnosis._id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{diagnosis.patient?.fullName}</p>
                    <Badge tone={diagnosis.severity}>{diagnosis.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{diagnosis.icdCode} · {diagnosis.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(diagnosis.diagnosedDate).toLocaleDateString()}</p>
                </div>
              ))}
            {!stats.riskDiagnoses.length && <p className="text-sm text-slate-500">No critical or high-risk diagnoses recorded.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Diagnosis Trend</h2>
          <p className="text-sm text-slate-500">Monthly diagnosis volume from live records.</p>
          <div className="mt-5 space-y-4">
            {stats.monthlyDiagnosisTrend.map((item) => (
              <ProgressRow key={`${item._id.year}-${item._id.month}`} label={monthLabel(item)} value={item.count} max={maxMonthlyTrend} helper={`${item.count} records`} tone="bg-cyan-600" />
            ))}
            {!stats.monthlyDiagnosisTrend.length && <p className="text-sm text-slate-500">No diagnosis trend data yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Department Workload</h2>
          <div className="mt-5 space-y-4">
            {stats.departmentLoad.map((item) => (
              <ProgressRow key={item._id} label={item._id} value={item.count} max={maxDepartment} helper={`${item.count} patients`} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Doctor Patient Load</h2>
          <p className="text-sm text-slate-500">Average {stats.averageDiagnosesPerPatient} diagnoses per patient.</p>
          <div className="mt-5 space-y-4">
            {stats.doctorLoad.map((item) => (
              <ProgressRow key={item._id} label={item._id} value={item.count} max={maxDoctorLoad} helper={`${item.count} · ${item.specialty}`} tone="bg-green-600" />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Recent Patients</h2>
          <div className="mt-4 space-y-3">
            {stats.recentPatients.map((patient) => (
              <div key={patient._id} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-medium text-slate-950">{patient.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {patient.assignedDoctor?.fullName || 'No doctor assigned'} · {patient.assignedDoctor?.department || 'Unassigned'}
                  </p>
                </div>
                <span className="text-sm text-slate-500">{new Date(patient.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Recent Diagnoses</h2>
          <div className="mt-4 space-y-3">
            {stats.recentDiagnoses.map((diagnosis) => (
              <div key={diagnosis._id} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-medium text-slate-950">
                    {diagnosis.icdCode} · {diagnosis.patient?.fullName}
                  </p>
                  <p className="text-sm text-slate-500">{diagnosis.description}</p>
                </div>
                <Badge tone={diagnosis.severity}>{diagnosis.severity}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
