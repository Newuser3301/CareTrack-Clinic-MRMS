import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 shadow-[0_28px_90px_rgba(2,6,23,0.34)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-black text-white">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 bg-white/10 px-0 text-white hover:bg-white/20" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>
        <div className="overflow-visible bg-cyan-50/96 p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
