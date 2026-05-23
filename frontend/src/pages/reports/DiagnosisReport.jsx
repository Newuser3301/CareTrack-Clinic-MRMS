import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Table from '../../components/Table';
import { useLanguage } from '../../context/LanguageContext';
import { toI18nKey } from '../../utils/i18nKeys';

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
};

const DiagnosisReport = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/reports/patients/${id}/diagnosis`)
      .then(({ data }) => setReport(data))
      .catch((err) => setError(err.response?.data?.message || t('common.loadingError')));
  }, [id]);

  if (error) return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>;
  if (!report) return <Loader />;

  const patient = report.patient;
  const doctor = patient?.assignedDoctor;
  const diagnoses = report.diagnoses || [];
  const doctorSpecialty = doctor?.specialty ? t(`specialties.${toI18nKey(doctor.specialty)}`, doctor.specialty) : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('reports.diagnosis', 'Tashxis hisoboti')}</h1>
          <p className="text-sm text-slate-500">{t('reports.generated', 'Yaratilgan')}: {formatDate(report.generatedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}><Printer size={16} />{t('reports.print', 'Chop etish')}</Button>
          <Link to={`/patients/${id}`}><Button variant="secondary"><ArrowLeft size={16} />{t('common.back')}</Button></Link>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('patients.patientInfo', 'Bemor ma’lumotlari')}</h2>
        <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div><span className="text-slate-500">{t('common.name')}:</span> {patient?.fullName}</div>
          <div><span className="text-slate-500">{t('common.phone')}:</span> {patient?.phone}</div>
          <div><span className="text-slate-500">{t('common.email')}:</span> {patient?.email}</div>
          <div><span className="text-slate-500">{t('common.gender')}:</span> {patient?.gender}</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('reports.assignedDoctor', 'Biriktirilgan shifokor')}</h2>
        <div className="mt-2 text-sm text-slate-700">
          <div>{doctor?.fullName || '-'}</div>
          <div className="text-slate-500">{doctorSpecialty || ''}</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t('nav.diagnoses')} ({diagnoses.length})</h2>
        <Table
          columns={[
            { key: 'diagnosedDate', label: t('common.date'), render: (row) => formatDate(row.diagnosedDate) },
            { key: 'icdCode', label: 'ICD' },
            { key: 'severity', label: t('common.severity'), render: (row) => t(`severity.${row.severity}`, row.severity) },
            { key: 'description', label: t('common.description') }
          ]}
          data={diagnoses}
        />
      </section>
    </div>
  );
};

export default DiagnosisReport;
