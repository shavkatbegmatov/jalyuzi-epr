import { useTranslation } from 'react-i18next';
import { useShopStore } from '../../store/shopStore';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useShopStore();

  const handleLanguageChange = (lang: 'uz' | 'ru') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="hidden sm:inline">{language === 'uz' ? "O'zbekcha" : 'Русский'}</span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </label>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 text-base-content rounded-box w-40"
      >
        <li>
          <button
            onClick={() => handleLanguageChange('uz')}
            className={language === 'uz' ? 'active' : ''}
          >
            O'zbekcha
          </button>
        </li>
        <li>
          <button
            onClick={() => handleLanguageChange('ru')}
            className={language === 'ru' ? 'active' : ''}
          >
            Русский
          </button>
        </li>
      </ul>
    </div>
  );
}
