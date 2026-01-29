import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES } from '../../data/gameData';
import Button from './Button';
import SaveImportModal from './SaveImportModal';

// Format timestamp as MM/DD H:MM AM/PM
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour, 0 becomes 12
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes} ${ampm}`;
}

function Header() {
  const { currentLanguage, changeLanguage, ownedTagIds, saveSourceName, clearSaveData, studioName, saveWatcher, saveFileTimestamp } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tagCount = ownedTagIds ? ownedTagIds.size : 0;
  const isWatching = saveWatcher?.isWatching;
  const formattedTimestamp = formatTimestamp(saveFileTimestamp);

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
                {isWatching && (
                  <span className="watch-indicator-header" title={`Watching: ${saveWatcher.directoryName}`}></span>
                )}
                {studioName && (
                  <span className="studio-name">{studioName}</span>
                )}
                <span className="save-info">{tagCount} tags loaded</span>
                {formattedTimestamp && (
                  <span className="save-timestamp" title="File modification time">{formattedTimestamp}</span>
                )}
                <Button 
                  size="icon"
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  title="Save settings"
                >
                  ⚙
                </Button>
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
