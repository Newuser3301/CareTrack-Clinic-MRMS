import { Trash2, X } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => {
  const { t } = useLanguage();

  return (
    <Modal open={open} title={title || t('common.delete')} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          <X size={16} />
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          <Trash2 size={16} />
          {loading ? t('common.deleting') : t('common.delete')}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
