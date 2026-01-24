import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../data/gameData';
import SaveImportModal from './SaveImportModal';

function Header() {
  const { currentLanguage, changeLanguage, ownedTagIds, saveSourceName, clearSaveData } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tagCount = ownedTagIds ? ownedTagIds.size : 0;

  return (
    <header>
      <div className="header-content">
        <div className="logo-area">
          <h1>Hollywood <span className="accent">Animal</span></h1>
          <h2>Calculator</h2>
        </div>

        <div className="header-controls">
          {/* Save file status/controls */}
          <div className="save-status-wrapper">
            {ownedTagIds ? (
              <div className="save-loaded">
                <span className="save-info">{tagCount} tags loaded</span>
                <button 
                  className="save-clear-btn"
                  onClick={clearSaveData}
                  title="Clear save data"
                >
                  ×
                </button>
              </div>
            ) : (
              <button 
                className="load-save-btn"
                onClick={() => setIsModalOpen(true)}
              >
                Load Save
              </button>
            )}
          </div>

          {/* Language selector */}
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
      </div>

      <SaveImportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </header>
  );
}

export default Header;
