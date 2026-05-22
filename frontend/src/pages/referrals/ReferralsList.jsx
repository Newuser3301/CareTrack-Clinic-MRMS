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
    const commands = [
      textCmd(labels.ministry, 70, 700, 12),
      lineCmd(70, 670, 300, 670),
      textCmd(labels.institution, 105, 656, 10),
      textCmd(labels.document, 385, 700, 12),
      textCmd(labels.form, 405, 684, 11),
      textCmd(`${labels.date}: ${date}`, 405, 668, 10),
      textCmd(labels.title, 190, 620, 18, true),
      textCmd(`(${labels.subtitle})`, 218, 600, 12, true),
      textCmd(labels.patient, 55, 560, 12),
      lineCmd(135, 558, 540, 558),
      textCmd(patient.fullName || '-', 145, 562, 12),
      textCmd(labels.phone, 55, 535, 12),
      lineCmd(125, 533, 265, 533),
      textCmd(patient.phone || '-', 135, 537, 11),
      textCmd(labels.birthDate, 285, 535, 12),
      lineCmd(390, 533, 540, 533),
      textCmd(birthDate, 400, 537, 11),
      textCmd(labels.address, 55, 510, 12),
      lineCmd(130, 508, 540, 508),
      textCmd(patient.address || '-', 140, 512, 10),
      textCmd(labels.department, 55, 485, 12),
      lineCmd(150, 483, 330, 483),
      textCmd(referral.toDepartment || '-', 160, 487, 11),
      textCmd(labels.doctor, 345, 485, 12),
      lineCmd(410, 483, 540, 483),
      textCmd(referral.toDoctor?.fullName || '-', 420, 487, 11),
      textCmd(labels.priority, 55, 460, 12),
      lineCmd(145, 458, 260, 458),
      textCmd(referral.priority || '-', 155, 462, 11),
      textCmd(labels.description, 245, 425, 16, true)
    ];
    wrapPdfText(referral.reason || '-', 76).slice(0, 8).forEach((line, index) => {
      commands.push(textCmd(`${index + 1}. ${line}`, 70, 390 - index * 22, 12));
    });
    commands.push(
      textCmd(labels.validity, 135, 170, 11),
      lineCmd(285, 168, 455, 168),
      lineCmd(70, 110, 170, 110),
      textCmd(labels.stamp, 85, 95, 10),
      textCmd(labels.responsible, 240, 125, 11),
      lineCmd(370, 123, 540, 123),
      textCmd(`(${labels.signature})`, 430, 108, 10),
      textCmd(labels.receptionist, 240, 80, 11),
      lineCmd(350, 78, 540, 78),
      textCmd(`(${labels.signature})`, 430, 63, 10)
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
