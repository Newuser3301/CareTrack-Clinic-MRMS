import { useEffect, useState } from 'react';
import { FileDown, Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Table from '../../components/Table';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { permissions } from '../../utils/permissions';
import ReferralForm from './ReferralForm';

const ReferralsList = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const role = user?.role;
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, referral: null });
  const [confirm, setConfirm] = useState(null);
  const defaultInstitutionName = 'CareTrack Clinic';

  const canCreate = permissions.canCreateReferral(role);
  const canEdit = permissions.canEditReferral(role);
  const canDelete = permissions.canDeleteReferral(role);
  const loadReferrals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/referrals', { params: { search: search || undefined } });
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    if (!canCreate && !canEdit) return;
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get('/patients', { params: { search: '' } }),
        api.get('/doctors', { params: { search: '' } })
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch {
      // lookups are optional for read-only view
    }
  };

  useEffect(() => {
    loadLookups();
  }, [canCreate, canEdit]);

  useEffect(() => {
    const timer = setTimeout(loadReferrals, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const referralPdfLabels = {
    uz: {
      ministry: "Sogliqni saqlash vazirligi",
      document: "Tibbiy hujjat",
      form: "Yollanma shakli",
      institution: "muassasa nomi",
      title: "TIBBIY YOLLANMA",
      subtitle: "CareTrack Clinic MRMS",
      patient: "Bemor",
      phone: "Telefon",
      birthDate: "Tugilgan sana",
      address: "Manzil",
      department: "Bolim",
      doctor: "Shifokor",
      priority: "Ustuvorlik",
      date: "Sana",
      description: "TAVSIF",
      validity: "Yollanma muddati",
      responsible: "Masul shifokor",
      receptionist: "Qabul xodimi",
      signature: "imzo",
      stamp: "Muhr joyi"
    },
    en: {
      ministry: "Ministry of Health",
      document: "Medical documentation",
      form: "Referral form",
      institution: "institution name",
      title: "MEDICAL REFERRAL",
      subtitle: "CareTrack Clinic MRMS",
      patient: "Patient",
      phone: "Phone",
      birthDate: "Date of birth",
      address: "Address",
      department: "Department",
      doctor: "Doctor",
      priority: "Priority",
      date: "Date",
      description: "DESCRIPTION",
      validity: "Referral validity",
      responsible: "Responsible doctor",
      receptionist: "Receptionist",
      signature: "signature",
      stamp: "Stamp area"
    },
    ru: {
      ministry: "Ministerstvo zdravookhraneniya",
      document: "Meditsinskaya dokumentatsiya",
      form: "Forma napravleniya",
      institution: "naimenovanie uchrezhdeniya",
      title: "MEDITSINSKOE NAPRAVLENIE",
      subtitle: "CareTrack Clinic MRMS",
      patient: "Pacient",
      phone: "Telefon",
      birthDate: "Data rozhdeniya",
      address: "Adres",
      department: "Otdelenie",
      doctor: "Vrach",
      priority: "Prioritet",
      date: "Data",
      description: "OPISANIE",
      validity: "Srok deystviya napravleniya",
      responsible: "Otvetstvennyy vrach",
      receptionist: "Registrator",
      signature: "podpis",
      stamp: "Mesto pechati"
    }
  };

  const pdfText = (value) =>
    String(value ?? '-')
      .replaceAll("'", "'")
      .replaceAll('‘', "'")
      .replaceAll('’', "'")
      .replaceAll('ʻ', "'")
      .replaceAll('`', "'")
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[\\()]/g, '\\$&');

  const wrapPdfText = (value, max = 86) => {
    const words = String(value || '-').split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach((word) => {
      if (`${current} ${word}`.trim().length > max) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    });
    if (current) lines.push(current);
    return lines;
  };

  const textCmd = (text, x, y, size = 12, bold = false) =>
    `/${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(text)}) Tj`;

  const lineCmd = (x1, y1, x2, y2) => `${x1} ${y1} m ${x2} ${y2} l S`;
  const rectCmd = (x, y, w, h) => `${x} ${y} ${w} ${h} re S`;
  const fillRectCmd = (x, y, w, h, gray = 0.94) => `q ${gray} g ${x} ${y} ${w} ${h} re f Q`;
  const strokeColorCmd = (r, g, b) => `${r} ${g} ${b} RG`;
  const fillColorCmd = (r, g, b) => `${r} ${g} ${b} rg`;

  const downloadPdf = (filename, commands) => {
    const stream = `q\n0.8 w\n${commands.join('\n')}\nQ`;
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
      `6 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    });
    const xrefAt = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadReferralPdf = (referral) => {
    const labels = referralPdfLabels[language] || referralPdfLabels.uz;
    const patient = referral.patient || {};
    const date = referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const birthDate = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-';
    const institutionName = referral.institutionName || defaultInstitutionName;
    const referralNumber = referral.referralNumber || referral._id?.slice(-8)?.toUpperCase() || '-';
    const responsibleDoctor = referral.responsibleDoctorName || referral.fromDoctor?.fullName || referral.toDoctor?.fullName || '-';
    const receptionist = referral.receptionistName || referral.createdBy?.name || '-';
    const commands = [
      strokeColorCmd(0.08, 0.28, 0.45),
      rectCmd(36, 36, 540, 720),
      fillRectCmd(36, 705, 540, 51, 0.9),
      rectCmd(36, 705, 540, 51),
      fillColorCmd(0.03, 0.24, 0.38),
      textCmd('CARETRACK CLINIC', 60, 732, 16, true),
      textCmd(labels.subtitle, 60, 714, 10),
      textCmd(labels.document, 390, 732, 11, true),
      textCmd(labels.form, 390, 716, 10),
      fillColorCmd(0, 0, 0),
      textCmd(labels.ministry, 62, 675, 11),
      textCmd(institutionName, 62, 656, 11, true),
      lineCmd(62, 650, 285, 650),
      textCmd(labels.institution, 102, 636, 9),
      textCmd(`${labels.date}: ${date}`, 392, 675, 10),
      textCmd(`No: ${referralNumber}`, 392, 658, 10),
      textCmd(labels.title, 202, 602, 18, true),
      lineCmd(185, 594, 428, 594),
      textCmd(`(${labels.subtitle})`, 224, 580, 10, true),
      fillRectCmd(55, 525, 502, 38, 0.96),
      rectCmd(55, 525, 502, 38),
      textCmd(`${labels.patient}:`, 70, 548, 11, true),
      textCmd(patient.fullName || '-', 150, 548, 12),
      textCmd(`${labels.phone}:`, 70, 530, 10),
      textCmd(patient.phone || '-', 150, 530, 10),
      textCmd(`${labels.birthDate}:`, 320, 530, 10),
      textCmd(birthDate, 420, 530, 10),
      fillRectCmd(55, 468, 502, 46, 0.98),
      rectCmd(55, 468, 502, 46),
      textCmd(`${labels.address}:`, 70, 495, 10),
      textCmd(patient.address || '-', 150, 495, 10),
      textCmd(`${labels.department}:`, 70, 475, 10),
      textCmd(referral.toDepartment || '-', 150, 475, 10),
      textCmd(`${labels.doctor}:`, 320, 475, 10),
      textCmd(referral.toDoctor?.fullName || '-', 390, 475, 10),
      textCmd(`${labels.priority}: ${referral.priority || '-'}`, 70, 446, 11, true),
      fillRectCmd(55, 395, 502, 32, 0.9),
      rectCmd(55, 395, 502, 32),
      textCmd(labels.description, 240, 406, 15, true),
      rectCmd(55, 200, 502, 190)
    ];
    wrapPdfText(referral.reason || '-', 72).slice(0, 7).forEach((line, index) => {
      commands.push(textCmd(`${index + 1}. ${line}`, 75, 365 - index * 23, 11));
    });
    commands.push(
      textCmd(`${labels.validity}:`, 120, 172, 10),
      textCmd(referral.validityPeriod || '-', 250, 172, 10),
      lineCmd(250, 170, 455, 170),
      rectCmd(70, 78, 105, 65),
      textCmd(labels.stamp, 92, 108, 10),
      textCmd(labels.responsible, 230, 126, 10),
      textCmd(responsibleDoctor, 360, 136, 9),
      lineCmd(360, 124, 535, 124),
      textCmd(`(${labels.signature})`, 420, 110, 9),
      textCmd(labels.receptionist, 230, 86, 10),
      textCmd(receptionist, 340, 96, 9),
      lineCmd(340, 84, 535, 84),
      textCmd(`(${labels.signature})`, 420, 70, 9)
    );
    downloadPdf(`referral-${referral._id || Date.now()}.pdf`, commands);
  };

  const saveReferral = async (payload) => {
    setSaving(true);
    try {
      const { data } = modal.referral
        ? await api.put(`/referrals/${modal.referral._id}`, payload)
        : await api.post('/referrals', payload);
      setModal({ open: false, referral: null });
      downloadReferralPdf(data);
      await loadReferrals();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToSave'));
    } finally {
      setSaving(false);
    }
  };

  const deleteReferral = async () => {
    setSaving(true);
    try {
      await api.delete(`/referrals/${confirm._id}`);
      setConfirm(null);
      await loadReferrals();
    } catch (err) {
      setError(err.response?.data?.message || t('common.unableToDelete'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.referrals', 'Yo‘llanmalar')}</h1>
          <p className="text-sm text-slate-500">{t('referrals.subtitle', 'Bo‘limlar o‘rtasida yo‘llanmalarni boshqarish.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate && <Button onClick={() => setModal({ open: true, referral: null })}><Plus size={16} />{t('referrals.new', 'Yangi yo‘llanma')}</Button>}
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-4">
          <SearchBar value={search} onChange={setSearch} placeholder={`${t('common.search')}...`} />
        </div>
      </div>

      {loading ? <Loader /> : (
        <Table
          columns={[
            { key: 'patient', label: t('nav.patients'), render: (row) => row.patient?.fullName || '-' },
            { key: 'toDepartment', label: t('forms.department', "Bo'lim"), render: (row) => row.toDepartment || '-' },
            { key: 'toDoctor', label: t('nav.doctors'), render: (row) => row.toDoctor?.fullName || '-' },
            { key: 'priority', label: t('referrals.priority', 'Ustuvorlik'), render: (row) => row.priority },
          ]}
          data={items}
          renderActions={(row) => (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => downloadReferralPdf(row)} aria-label="PDF"><FileDown size={16} /></Button>
              {canEdit && <Button variant="secondary" className="h-9 w-9 px-0" onClick={() => setModal({ open: true, referral: row })} aria-label={t('actions.edit')}><Pencil size={16} /></Button>}
              {canDelete && <Button variant="danger" className="h-9 w-9 px-0" onClick={() => setConfirm(row)} aria-label={t('actions.delete')}><Trash2 size={16} /></Button>}
            </div>
          )}
        />
      )}

      <Modal open={modal.open} title={modal.referral ? t('nav.referrals', 'Yo‘llanma') : t('referrals.new', 'Yangi yo‘llanma')} onClose={() => setModal({ open: false, referral: null })}>
        <ReferralForm
          patients={patients}
          doctors={doctors}
          initialData={modal.referral}
          onSubmit={saveReferral}
          loading={saving}
          onCancel={() => setModal({ open: false, referral: null })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        message={`${t('common.delete')} ${confirm?.patient?.fullName || ''}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteReferral}
        loading={saving}
      />
    </div>
  );
};

export default ReferralsList;
