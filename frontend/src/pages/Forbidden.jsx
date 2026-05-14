import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/Button';
import { useLanguage } from '../context/LanguageContext';

const Forbidden = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-50 text-red-600">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-950">{t('common.forbidden')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('common.forbiddenText')}</p>
        <Link to="/" className="mt-5 inline-flex">
          <Button variant="secondary">{t('common.backToDashboard')}</Button>
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;
