import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../data/gameData';
import Button from './Button';
import SaveImportModal from './SaveImportModal';

function Header() {
  const { currentLanguage, changeLanguage, ownedTagIds, saveSourceName, clearSaveData, studioName } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tagCount = ownedTagIds ? ownedTagIds.size : 0;

  return (
    <header>
      <div className="header-content">
        <div className="logo-area">
          <div className="logo-title-group">
            <h1><span>Hollywood</span> <span className="accent">Animal</span></h1>
            <span className="header-subtitle">Unofficial Calculator Tool</span>
          </div>
        </div>

        <div className="header-controls">
          {/* Save file status/controls */}
          <div className="save-status-wrapper">
            {ownedTagIds ? (
              <div className="save-loaded">
                {studioName && (
                  <span className="studio-name">{studioName}</span>
                )}
                <span className="save-info">{tagCount} tags loaded</span>
                <Button 
                  size="icon"
                  variant="primary"
                  onClick={clearSaveData}
                  title="Clear save data"
                >
                  ×
                </Button>
              </div>
            ) : (
              <Button 
                size="md"
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                title="Load Save"
              />
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
