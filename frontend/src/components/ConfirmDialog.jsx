import { Trash2, X } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

const ConfirmDialog = ({ open, title = 'Confirm action', message, onConfirm, onCancel, loading }) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <p className="text-sm text-slate-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onCancel} disabled={loading}>
        <X size={16} />
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        <Trash2 size={16} />
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
