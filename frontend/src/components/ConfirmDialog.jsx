import Button from './Button';
import Modal from './Modal';

const ConfirmDialog = ({ open, title = 'Confirm action', message, onConfirm, onCancel, loading }) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <p className="text-sm text-slate-600">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
