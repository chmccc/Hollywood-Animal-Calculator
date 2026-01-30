import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Button from './Button';

/**
 * Modal for importing save.json data via file upload or watching a directory.
 * Extracts owned tags from the save file's tagPool.
 */
function SaveImportModal({ isOpen, onClose }) {
  const { loadSaveData, saveWatcher, isFileSystemAccessSupported } = useApp();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleWatchFolder = async () => {
    setError(null);
    const success = await saveWatcher.selectDirectory();
    if (success) {
      onClose();
    } else if (saveWatcher.error) {
      setError(saveWatcher.error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      // Pass the file's lastModified timestamp
      const result = loadSaveData(event.target.result, file.name, file.lastModified);
      setIsLoading(false);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      setError('Failed to read file');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content save-import-modal">
        <div className="modal-header">
          <h3>Load Save File</h3>
          <Button size="icon" variant="primary" onClick={onClose}>×</Button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Import your Hollywood Animal saves to filter tags to only those you've researched.
            Your save data stays in your browser - nothing is uploaded to any server.
          </p>
          
          <p className="modal-path-hint">
            <strong>Windows save location:</strong><br />
            <code>C:\Users\&lt;username&gt;\AppData\LocalLow\Weappy\Hollywood Animal\Saves\Profiles\0</code>
          </p>

          <p className="modal-warning">
            <strong>Note:</strong> Loading or clearing a save will reset all form selections.
          </p>

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          {/* Option 1: File Upload */}
          <h4 className="import-option-title">Option 1: Choose File</h4>
          <p className="import-option-desc">Select your latest JSON save file from disk.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button 
            size="lg"
            fullWidth
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title={isLoading ? 'Loading...' : 'Choose File...'}
          />

          {/* Option 2: Watch Folder (Chrome/Edge only) */}
          {isFileSystemAccessSupported && (
            <>
              <div className="import-divider">
                <span>OR</span>
              </div>

              <h4 className="import-option-title">Option 2: Watch Save Folder</h4>
              <p className="import-option-desc">
                Automatically load saves when you save the game. 
                Select your save folder and the calculator will monitor it for changes, loading the latest one.
              </p>
              <p className="modal-warning">
                <strong>Note:</strong> This feature requires Chrome or Edge. 
                The built-in Steam browser does not support file watching.
              </p>
              {saveWatcher.isWatching ? (
                <div className="watch-status">
                  <div className="watch-active">
                    <span className="watch-indicator"></span>
                    <span>Watching: <strong>{saveWatcher.directoryName}</strong></span>
                  </div>
                  {saveWatcher.lastLoadedFile && (
                    <p className="last-loaded">Last loaded: {saveWatcher.lastLoadedFile}</p>
                  )}
                  <div className="watch-actions">
                    <Button 
                      size="md"
                      variant="primary"
                      onClick={() => saveWatcher.forceReload()}
                      title="Reload Now"
                    />
                    <Button 
                      size="md"
                      onClick={() => {
                        saveWatcher.stopWatching();
                      }}
                      title="Stop Watching"
                    />
                  </div>
                </div>
              ) : (
                <Button 
                  size="lg"
                  fullWidth
                  variant="primary"
                  onClick={handleWatchFolder}
                  disabled={saveWatcher.isLoading}
                  title={saveWatcher.isLoading ? 'Selecting...' : 'Select Save Folder...'}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SaveImportModal;
