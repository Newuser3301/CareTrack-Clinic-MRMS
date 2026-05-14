import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">{t('common.pageMissing')}</p>
      <Link to="/" className="mt-6">
        <Button><ArrowLeft size={16} />{t('common.backToDashboard')}</Button>
      </Link>
    </div>
  );
};

export default NotFound;
