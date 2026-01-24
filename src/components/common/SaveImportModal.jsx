import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Modal for importing save.json data via file upload or paste.
 * Extracts owned tags from the save file's tagPool.
 */
function SaveImportModal({ isOpen, onClose }) {
  const { loadSaveData } = useApp();
  const [pasteContent, setPasteContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = loadSaveData(event.target.result, file.name);
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
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
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
            <p>Select your save.json file from disk.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button 
              className="import-btn file-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Choose File...'}
            </button>
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
            <button 
              className="import-btn paste-btn"
              onClick={handlePasteLoad}
              disabled={isLoading || !pasteContent.trim()}
            >
              {isLoading ? 'Loading...' : 'Load from Paste'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaveImportModal;
