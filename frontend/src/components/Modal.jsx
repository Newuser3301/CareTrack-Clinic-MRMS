import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/70 bg-cyan-50/95 shadow-soft">
        <div className="flex items-center justify-between border-b border-white/70 px-6 py-5">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>
        <div className="overflow-visible p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
