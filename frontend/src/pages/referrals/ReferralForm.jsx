import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { useLanguage } from '../../context/LanguageContext';

const priorities = ['low', 'normal', 'high', 'urgent'];
const defaultInstitutionName = 'CareTrack Clinic';

const ReferralForm = ({ patients = [], doctors = [], initialData, onSubmit, loading, onCancel }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    patient: '',
    toDoctor: '',
    institutionName: defaultInstitutionName,
    referralNumber: '',
    validityPeriod: '',
    responsibleDoctorName: '',
    receptionistName: '',
    reason: '',
    notes: '',
    priority: 'normal'
  });

  useEffect(() => {
    if (!initialData) {
      setForm({
        patient: patients[0]?._id || '',
        toDoctor: '',
        institutionName: defaultInstitutionName,
        referralNumber: '',
        validityPeriod: '',
        responsibleDoctorName: '',
        receptionistName: '',
        reason: '',
        notes: '',
        priority: 'normal'
      });
      return;
    }
    setForm({
      patient: initialData.patient?._id || '',
      toDoctor: initialData.toDoctor?._id || '',
      institutionName: initialData.institutionName || defaultInstitutionName,
      referralNumber: initialData.referralNumber || '',
      validityPeriod: initialData.validityPeriod || '',
      responsibleDoctorName: initialData.responsibleDoctorName || '',
      receptionistName: initialData.receptionistName || '',
      reason: initialData.reason || '',
      notes: '',
      priority: initialData.priority || 'normal'
    });
  }, [initialData, patients]);

  const patientOptions = useMemo(
    () => patients.map((p) => ({ value: p._id, label: `${p.fullName} (${p.phone || '-'})` })),
    [patients]
  );
  const doctorOptions = useMemo(
    () => [{ value: '', label: t('common.cancel', 'Tanlanmagan') }, ...doctors.map((d) => ({ value: d._id, label: d.fullName }))],
    [doctors]
  );

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      patient: form.patient,
      institutionName: form.institutionName || defaultInstitutionName,
      referralNumber: form.referralNumber || '',
      validityPeriod: form.validityPeriod || '',
      responsibleDoctorName: form.responsibleDoctorName || '',
      receptionistName: form.receptionistName || '',
      reason: form.reason,
      notes: '',
      priority: form.priority
    };
    if (form.toDoctor) payload.toDoctor = form.toDoctor;
    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Select
        label={t('nav.patients')}
        value={form.patient}
        onChange={(event) => setForm((s) => ({ ...s, patient: event.target.value }))}
        options={patientOptions}
        required
        disabled={Boolean(initialData)}
      />
      <Select
        label={t('reports.assignedDoctor', 'Biriktirilgan shifokor')}
        value={form.toDoctor}
        onChange={(event) => setForm((s) => ({ ...s, toDoctor: event.target.value }))}
        options={doctorOptions}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t('referrals.institutionName', 'Muassasa nomi')}
          value={form.institutionName}
          onChange={(event) => setForm((s) => ({ ...s, institutionName: event.target.value }))}
          placeholder={defaultInstitutionName}
        />
        <Input
          label={t('referrals.referralNumber', "Yo'llanma raqami")}
          value={form.referralNumber}
          onChange={(event) => setForm((s) => ({ ...s, referralNumber: event.target.value }))}
          placeholder="MRMS-001"
        />
        <Input
          label={t('referrals.validityPeriod', "Yo'llanma muddati")}
          value={form.validityPeriod}
          onChange={(event) => setForm((s) => ({ ...s, validityPeriod: event.target.value }))}
          placeholder="30 kun"
        />
        <Input
          label={t('referrals.responsibleDoctor', "Mas'ul shifokor")}
          value={form.responsibleDoctorName}
          onChange={(event) => setForm((s) => ({ ...s, responsibleDoctorName: event.target.value }))}
          placeholder="Dr. Amina Karimova"
        />
        <Input
          label={t('referrals.receptionist', 'Qabul xodimi')}
          value={form.receptionistName}
          onChange={(event) => setForm((s) => ({ ...s, receptionistName: event.target.value }))}
          placeholder="Qabul xodimi F.I.Sh."
        />
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-slate-600">{t('common.description', 'Tavsif')}</span>
        <textarea
          className="focus-ring min-h-32 w-full rounded-[1.15rem] border border-sky-100 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400"
          value={form.reason}
          onChange={(event) => setForm((s) => ({ ...s, reason: event.target.value }))}
          required
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t('common.severity', 'Ustuvorlik')}
          value={form.priority}
          onChange={(event) => setForm((s) => ({ ...s, priority: event.target.value }))}
          options={priorities.map((p) => ({ value: p, label: p }))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </div>
    </form>
  );
};

export default ReferralForm;
