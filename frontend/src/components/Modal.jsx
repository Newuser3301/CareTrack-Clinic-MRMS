import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ open, title, children, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

    const body = document.body;
    const html = document.documentElement;
    const scrollShell = document.getElementById('dashboard-scroll-shell');
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousShellOverflow = scrollShell?.style.overflow;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (scrollShell) scrollShell.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      if (scrollShell) scrollShell.style.overflow = previousShellOverflow || '';
    };
  }, [open]);

  if (!open) return null;

  const portalTarget = useMemo(() => (typeof document === 'undefined' ? null : document.body), []);
  if (!portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 shadow-[0_28px_90px_rgba(2,6,23,0.34)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-black text-white">{title}</h2>
          <Button
            variant="ghost"
            className="h-9 w-9 bg-white/10 px-0 text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto bg-cyan-50/96 p-6">{children}</div>
      </div>
    </div>,
    portalTarget
  );
};

export default Modal;
