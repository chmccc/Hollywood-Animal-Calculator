import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Button from './Button';

/**
 * Modal for importing save.json data via file upload or paste.
 * Extracts owned tags from the save file's tagPool.
 * Also supports watching a save directory for automatic updates.
 */
function SaveImportModal({ isOpen, onClose }) {
  const { loadSaveData, saveWatcher, isFileSystemAccessSupported } = useApp();
  const [pasteContent, setPasteContent] = useState('');
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

  const handlePasteLoad = () => {
    if (!pasteContent.trim()) {
      setError('Please paste save file content first');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use setTimeout to allow UI to update before parsing large JSON
    setTimeout(() => {
      const result = loadSaveData(pasteContent, 'Pasted Save');
      setIsLoading(false);
      
      if (result.success) {
        setPasteContent('');
        onClose();
      } else {
        setError(result.error);
      }
    }, 10);
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
          <p className="modal-warning">
            <strong>Note:</strong> Loading or clearing a save will reset all form selections.
          </p>

          <p className="modal-description">
            Import your Hollywood Animal save file to filter tags to only those you've researched.
            Your save data stays in your browser - nothing is uploaded to any server.
          </p>
          
          <p className="modal-path-hint">
            <strong>Windows save location:</strong><br />
            <code>C:\Users\&lt;username&gt;\AppData\LocalLow\Weappy\Hollywood Animal\Saves\Profiles\0</code>
          </p>

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          {/* Option 1: File Upload */}
          <div className="import-option">
            <h4>Option 1: Choose File</h4>
            <p>Select your latest JSON save file from disk.</p>
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
          </div>

          <div className="import-divider">
            <span>OR</span>
          </div>

          {/* Option 2: Paste Content */}
          <div className="import-option">
            <h4>Option 2: Paste Content</h4>
            <p>Copy your save file content and paste it below.</p>
            <textarea
              className="paste-textarea"
              placeholder="Paste save.json content here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              size="lg"
              fullWidth
              onClick={handlePasteLoad}
              disabled={isLoading || !pasteContent.trim()}
              title={isLoading ? 'Loading...' : 'Load from Paste'}
            />
          </div>

          {/* Option 3: Watch Folder (Chrome/Edge only) */}
          {isFileSystemAccessSupported && (
            <>
              <div className="import-divider">
                <span>OR</span>
              </div>

              <div className="import-option watch-folder-option">
                <h4>Option 3: Watch Save Folder</h4>
                <p>
                  Automatically load saves when you save the game. 
                  Select your save folder and the calculator will monitor it for changes.
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
                <p className="browser-note">
                  <em>Note: This feature requires Chrome or Edge.</em>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SaveImportModal;
