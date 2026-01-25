import { useRef } from 'react';
import { useScriptGeneratorContext } from '../../context/ScriptGeneratorContext';
import LayoutCard from '../common/LayoutCard';
import Button from '../common/Button';
import ScriptCard from '../generator/ScriptCard';

function PinnedScriptsTab({ onTransferToAdvertisers = null }) {
  const {
    pinnedScripts,
    togglePin,
    updateScriptName,
    exportPinnedScripts,
    importPinnedScripts
  } = useScriptGeneratorContext();

  const fileInputRef = useRef(null);

  const handleExport = () => {
    const result = exportPinnedScripts();
    if (result.error) {
      alert(result.error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importPinnedScripts(event.target.result);
      if (result.error) {
        alert(result.error);
      } else if (result.added) {
        alert(`Loaded ${result.added} scripts.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTransfer = (script) => {
    if (onTransferToAdvertisers) {
      onTransferToAdvertisers(script);
    }
  };

  return (
    <div id="tab-pinned" className="tab-content">
      <div className="pinned-layout">
        <LayoutCard
          id="pinned-scripts-container"
          title="Pinned Scripts"
          subtitle="Save your favorite script combinations for later. Pin scripts from the Generator or Compatibility tabs."
          headerActions={
            <>
              <Button size="sm" variant="primary" onClick={handleExport} title="⬇ Save" />
              <Button size="sm" variant="primary" onClick={handleImportClick} title="⬆ Load" />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden-file-input"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </>
          }
        >
          {pinnedScripts.length === 0 ? (
            <div className="validation-placeholder">
              <div className="validation-placeholder-content">
                <span className="validation-status-text">
                  No pinned scripts yet. Pin scripts from the Generator or Compatibility tabs.
                </span>
              </div>
            </div>
          ) : (
            <div id="pinnedResultsList" className="script-list">
              {pinnedScripts.map(script => (
                <ScriptCard
                  key={script.uniqueId}
                  script={script}
                  isPinned={true}
                  onTogglePin={() => togglePin(script.uniqueId)}
                  onNameChange={(name) => updateScriptName(script.uniqueId, name)}
                  onTransfer={onTransferToAdvertisers ? handleTransfer : null}
                />
              ))}
            </div>
          )}
        </LayoutCard>
      </div>
    </div>
  );
}

export default PinnedScriptsTab;
