import { ChevronDown, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = ({ compact = false }) => {
  const { language, languages, setLanguage } = useLanguage();
  const containerClass = compact
    ? 'w-12 justify-center px-0 sm:w-36 sm:justify-start sm:px-3'
    : 'w-44 px-3';
  const selectClass = compact
    ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0 sm:static sm:h-auto sm:w-auto sm:flex-1 sm:opacity-100'
    : 'min-w-0 flex-1';

  return (
    <label
      className={`relative flex shrink-0 items-center gap-2 rounded-2xl bg-white/70 py-2 text-sm font-black text-slate-700 shadow-sm ${containerClass}`}
    >
      <Languages size={18} className="shrink-0 text-primary-700" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={`${selectClass} appearance-none truncate bg-transparent pr-6 text-sm font-black outline-none`}
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
        className="pointer-events-none absolute right-1 top-1/2 hidden -translate-y-1/2 text-slate-500 sm:right-3 sm:block"
        aria-hidden="true"
      />
    </label>
  );
};

export default LanguageSwitcher;
