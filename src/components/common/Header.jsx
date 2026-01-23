import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../data/gameData';

function Header() {
  const { currentLanguage, changeLanguage } = useApp();

  return (
    <header>
      <div className="header-content">
        <div className="logo-area">
          <h1>Hollywood <span className="accent">Animal</span></h1>
          <h2>Calculator</h2>
        </div>

        <div className="lang-wrapper">
          <select
            id="languageSelector"
            className="lang-dropdown"
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

export default Header;
