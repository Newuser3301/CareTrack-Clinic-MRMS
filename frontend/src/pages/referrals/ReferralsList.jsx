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
  const { t } = useLanguage();
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
  const escapeHtml = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

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

  const pdfText = (value) =>
    String(value ?? '-')
      .replaceAll("'", "'")
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[\\()]/g, '\\$&');

  const downloadPdf = (filename, lines) => {
    const contentLines = lines.map((line, index) => {
      const y = 742 - index * 24;
      const size = index === 0 ? 18 : 11;
      const font = index === 0 ? 'F2' : 'F1';
      return `/${font} ${size} Tf 1 0 0 1 50 ${y} Tm (${pdfText(line)}) Tj`;
    });
    const stream = `BT\n${contentLines.join('\n')}\nET`;
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
    const date = referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    downloadPdf(`referral-${referral._id || Date.now()}.pdf`, [
      'CareTrack Clinic - Referral',
      `Patient: ${referral.patient?.fullName || '-'}`,
      `Phone: ${referral.patient?.phone || '-'}`,
      `Department: ${referral.toDepartment || '-'}`,
      `Doctor: ${referral.toDoctor?.fullName || '-'}`,
      `Priority: ${referral.priority || '-'}`,
      `Date: ${date}`,
      '',
      'Description:',
      referral.reason || '-'
    ]);
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

  const exportPdf = () => {
    const rows = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.patient?.fullName || '-')}</td>
        <td>${escapeHtml(item.toDepartment || '-')}</td>
        <td>${escapeHtml(item.toDoctor?.fullName || '-')}</td>
        <td>${escapeHtml(item.reason || '-')}</td>
        <td>${escapeHtml(item.priority || '-')}</td>
        <td>${escapeHtml(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-')}</td>
      </tr>
    `).join('');
    const popup = window.open('', '_blank', 'width=1100,height=800');
    if (!popup) return;

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CareTrack Referrals</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            p { margin: 0 0 24px; color: #64748b; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #dbeafe; padding: 10px; text-align: left; vertical-align: top; }
            th { background: #e0f2fe; color: #075985; }
            tr:nth-child(even) td { background: #f8fafc; }
            @media print { body { padding: 18px; } button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="float:right;padding:10px 16px;border:0;border-radius:999px;background:#075795;color:white;font-weight:700;">PDF / Print</button>
          <h1>CareTrack Clinic - Yo'llanmalar</h1>
          <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
          <table>
            <thead>
              <tr>
                <th>Bemor</th>
                <th>Bo'lim</th>
                <th>Shifokor</th>
                <th>Tavsif</th>
                <th>Daraja</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">Yozuvlar topilmadi.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.referrals', 'Yo‘llanmalar')}</h1>
          <p className="text-sm text-slate-500">{t('referrals.subtitle', 'Bo‘limlar o‘rtasida yo‘llanmalarni boshqarish.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportPdf}><FileDown size={16} />PDF</Button>
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
