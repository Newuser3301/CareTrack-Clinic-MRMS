import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = ({ compact = false }) => {
  const { language, languages, setLanguage } = useLanguage();

  return (
    <label className={`flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm font-black text-slate-700 shadow-sm ${compact ? '' : 'min-w-36'}`}>
      <Languages size={18} className="text-primary-700" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="w-full bg-transparent text-sm font-black outline-none"
        aria-label="Language"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
