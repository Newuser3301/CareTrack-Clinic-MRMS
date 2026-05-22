import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ open, title, children, onClose }) => {
  const isOpen = open;
  const portalTarget = useMemo(() => (typeof document === 'undefined' ? null : document.body), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (!portalTarget) return undefined;

    const body = portalTarget;
    const html = portalTarget.ownerDocument?.documentElement;
    const scrollShell = portalTarget.ownerDocument?.getElementById('dashboard-scroll-shell');
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html?.style.overflow;
    const previousShellOverflow = scrollShell?.style.overflow;

    body.style.overflow = 'hidden';
    if (html) html.style.overflow = 'hidden';
    if (scrollShell) scrollShell.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      if (html) html.style.overflow = previousHtmlOverflow || '';
      if (scrollShell) scrollShell.style.overflow = previousShellOverflow || '';
    };
  }, [isOpen, portalTarget]);

  if (!isOpen) return null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-sky-50/95 shadow-[0_28px_90px_rgba(15,58,101,0.26)] ring-1 ring-sky-100/80 backdrop-blur max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sky-100/80 bg-white/80 px-6 py-5">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <Button
            variant="ghost"
            className="h-9 w-9 bg-sky-50 px-0 text-slate-600 hover:bg-white hover:text-primary-700"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="modal-scroll min-h-0 flex-1 overflow-y-auto bg-sky-50/80 p-6">{children}</div>
      </div>
    </div>,
    portalTarget
  );
};

export default Modal;
