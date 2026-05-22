import { ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = ({ compact = false }) => {
  const { language, languages, setLanguage } = useLanguage();
  const widthClass = compact ? 'w-36' : 'w-44';

  return (
    <label
      className={`relative flex shrink-0 items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm font-black text-slate-700 shadow-sm ${widthClass}`}
    >
      <Languages size={18} className="shrink-0 text-primary-700" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="min-w-0 flex-1 appearance-none truncate bg-transparent pr-6 text-sm font-black outline-none"
        aria-label="Language"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </label>
  );
};

export default LanguageSwitcher;
