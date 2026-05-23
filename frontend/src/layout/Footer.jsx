import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="border-t border-white/60 bg-white/35 px-4 py-5 text-sm text-slate-600 backdrop-blur dark:border-sky-900/70 dark:bg-slate-950/35 dark:text-slate-300 lg:px-8">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">
          © {year} <span className="font-extrabold text-slate-900 dark:text-sky-100">CareTrack Clinic</span> — {t('footer.rightsReserved')}
        </p>
        <p className="text-slate-500 dark:text-slate-300">{t('footer.tagline')}</p>
      </div>
    </footer>
  );
};

export default Footer;

