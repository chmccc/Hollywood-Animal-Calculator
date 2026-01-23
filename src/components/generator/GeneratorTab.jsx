import { useState, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useScriptGenerator } from '../../hooks/useScriptGenerator';
import Card from '../common/Card';
import Slider from '../common/Slider';
import CategorySelector from '../common/CategorySelector';
import TagBrowser from '../common/TagBrowser';
import ScriptCard from './ScriptCard';
import { collectTagInputs } from '../../utils/tagHelpers';

function GeneratorTab({ onTransferToAdvertisers = null }) {
  const { categories } = useApp();
  const {
    generatedScripts,
    pinnedScripts,
    generateScripts,
    togglePin,
    updateScriptName,
    exportPinnedScripts,
    importPinnedScripts,
    getExcludedTagsForStarterProfile
  } = useScriptGenerator();

  const [profile, setProfile] = useState('custom');
  const [targetComp, setTargetComp] = useState(4.0);
  const [targetScore, setTargetScore] = useState(6);
  const [lockedTags, setLockedTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [genrePercents, setGenrePercents] = useState({});
  const [excludedInputMode, setExcludedInputMode] = useState('browser'); // 'dropdown' | 'browser'
  
  const fileInputRef = useRef(null);

  // Memoized sets for TagBrowser
  const lockedTagIds = useMemo(() => 
    new Set(lockedTags.filter(t => t.id).map(t => t.id)), 
    [lockedTags]
  );
  const excludedTagIds = useMemo(() => 
    new Set(excludedTags.filter(t => t.id).map(t => t.id)), 
    [excludedTags]
  );

  const handleProfileChange = useCallback((newProfile) => {
    setProfile(newProfile);
    if (newProfile === 'starting') {
      const excluded = getExcludedTagsForStarterProfile();
      setExcludedTags(excluded);
    } else {
      setExcludedTags([]);
    }
  }, [getExcludedTagsForStarterProfile]);

  const handleGenrePercentChange = useCallback((tagId, value) => {
    setGenrePercents(prev => ({ ...prev, [tagId]: value }));
  }, []);

  const handleGenerate = () => {
    const fixedTags = collectTagInputs(
      lockedTags.filter(t => t.id),
      genrePercents
    );
    const excluded = collectTagInputs(
      excludedTags.filter(t => t.id),
      {}
    );

    const result = generateScripts(targetComp, targetScore, fixedTags, excluded);
    if (result.error) {
      alert(result.error);
    }
  };

  const handleResetLocks = () => {
    setLockedTags([]);
    setGenrePercents({});
  };

  const handleResetExcluded = () => {
    if (profile === 'starting') {
      const excluded = getExcludedTagsForStarterProfile();
      setExcludedTags(excluded);
    } else {
      setExcludedTags([]);
    }
  };

  // TagBrowser toggle handler for excluded tags
  const handleExcludedTagToggle = useCallback((tagId, category) => {
    setExcludedTags(prev => {
      const exists = prev.some(t => t.id === tagId);
      if (exists) {
        return prev.filter(t => t.id !== tagId);
      } else {
        return [...prev, { id: tagId, category }];
      }
    });
  }, []);

  // Quick exclude from generated results - adds tag to excluded and regenerates
  const handleExcludeFromResult = useCallback((tagId, category) => {
    // Check if already excluded
    if (excludedTags.some(t => t.id === tagId)) return;

    // Add to excluded tags
    const newExcludedTags = [...excludedTags, { id: tagId, category }];
    setExcludedTags(newExcludedTags);

    // Regenerate with the new exclusions immediately
    const fixedTags = collectTagInputs(
      lockedTags.filter(t => t.id),
      genrePercents
    );
    const excluded = collectTagInputs(
      newExcludedTags.filter(t => t.id),
      {}
    );

    const result = generateScripts(targetComp, targetScore, fixedTags, excluded);
    if (result.error) {
      alert(result.error);
    }
  }, [excludedTags, lockedTags, genrePercents, targetComp, targetScore, generateScripts]);

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

  const getRequiredTagsText = () => {
    let requiredTags = 4;
    if (targetScore <= 6) requiredTags = 4;
    else if (targetScore === 7) requiredTags = 6;
    else if (targetScore === 8) requiredTags = 8;
    else if (targetScore === 9) requiredTags = 9;
    else if (targetScore === 10) requiredTags = 10;
    return `Requires ~${requiredTags} Story Elements (excluding Genre & Setting).`;
  };

  return (
    <div id="tab-generator" className="tab-content">
      <Card className="builder-card">
        <div className="card-header">
          <h3>Generator Settings</h3>
        </div>
        
        {/* Profile Selection */}
        <div className="profile-control-container">
          <div className="profile-label-row">
            <label>Tag Availability</label>
          </div>
          <div className="profile-btn-group">
            <button
              className={`profile-btn ${profile === 'starting' ? 'active' : ''}`}
              onClick={() => handleProfileChange('starting')}
            >
              Starting Tags
            </button>
            <button
              className={`profile-btn ${profile === 'custom' ? 'active' : ''}`}
              onClick={() => handleProfileChange('custom')}
            >
              Custom
            </button>
          </div>
          <p className="subtitle" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
            {profile === 'starting' 
              ? <><strong style={{ color: 'var(--accent)' }}>Starting Tags</strong> are available. Everything else is moved to Excluded.</>
              : "All tags are available. You can manually exclude tags below."
            }
          </p>
        </div>

        <div className="score-controls-wrapper">
          <Slider
            label="Target Average Compatibility"
            value={targetComp}
            onChange={setTargetComp}
            min={1}
            max={5}
            step={0.1}
            sliderClass="com-slider"
            color="#4cd964"
            subtitle="The generator will attempt to find a script matching or exceeding this compatibility score."
          />
          <Slider
            label="Target Movie Score"
            value={targetScore}
            onChange={setTargetScore}
            min={6}
            max={10}
            step={1}
            sliderClass="art-slider"
            color="#d4af37"
            subtitle={<span style={{ color: 'var(--accent)' }}>{getRequiredTagsText()}</span>}
          />
        </div>

        <div className="divider-line"></div>

        {/* Locked Elements */}
        <div className="card-header">
          <h3>Locked Elements</h3>
          <button className="reset-btn" onClick={handleResetLocks}>Reset Locks</button>
        </div>
        <p className="subtitle">Select specific tags you <strong>MUST</strong> have in the script.</p>
        
        <div id="selectors-container-generator">
          {categories.map(category => (
            <CategorySelector
              key={category}
              category={category}
              selectedTags={lockedTags}
              onTagsChange={setLockedTags}
              genrePercents={genrePercents}
              onGenrePercentChange={handleGenrePercentChange}
              context="generator"
            />
          ))}
        </div>

        <div className="divider-line"></div>

        {/* Excluded Elements */}
        <div className="card-header">
          <h3 style={{ color: 'var(--danger)' }}>Excluded Elements</h3>
          <div className="header-controls">
            <button
              className="mode-toggle-btn"
              onClick={() => setExcludedInputMode(prev => prev === 'dropdown' ? 'browser' : 'dropdown')}
            >
              {excludedInputMode === 'dropdown' ? 'Use Browse Mode' : 'Use Dropdown Mode'}
            </button>
            <button className="reset-btn" onClick={handleResetExcluded}>Reset Bans</button>
          </div>
        </div>
        <p className="subtitle">Select tags to <strong>BAN</strong> (e.g., due to "The Code"). The generator will never pick these.</p>

        {excludedInputMode === 'dropdown' ? (
          <div id="selectors-container-excluded">
            {categories.map(category => (
              <CategorySelector
                key={`excluded-${category}`}
                category={category}
                selectedTags={excludedTags}
                onTagsChange={setExcludedTags}
                context="excluded"
                isExcluded={true}
              />
            ))}
          </div>
        ) : (
          <TagBrowser
            selectedTagIds={excludedTagIds}
            onToggle={handleExcludedTagToggle}
            variant="excluded"
          />
        )}

        <div className="action-area">
          <button className="analyze-btn" onClick={handleGenerate}>
            Generate Scripts
          </button>
        </div>
      </Card>

      {/* Pinned Scripts */}
      <div id="pinned-scripts-container" className="results-container">
        <div className="pinned-header-row">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <h3 style={{ color: 'var(--accent)', margin: 0 }}>Pinned Scripts</h3>
          </div>
          <div className="file-controls">
            <button className="file-action-btn" onClick={handleExport} title="Download Pinned Scripts">
              <span>⬇ Save</span>
            </button>
            <button className="file-action-btn" onClick={handleImportClick} title="Upload JSON File">
              <span>⬆ Load</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden-file-input"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div id="pinnedResultsList" className="script-list">
          {pinnedScripts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem', padding: '10px 0' }}>
              No pinned scripts yet.
            </div>
          ) : (
            pinnedScripts.map(script => (
              <ScriptCard
                key={script.uniqueId}
                script={script}
                isPinned={true}
                onTogglePin={() => togglePin(script.uniqueId)}
                onNameChange={(name) => updateScriptName(script.uniqueId, name)}
                onTransfer={onTransferToAdvertisers}
                lockedTagIds={lockedTagIds}
              />
            ))
          )}
        </div>
      </div>

      {/* Generated Scripts */}
      {generatedScripts.length > 0 && (
        <div id="results-generator" className="results-container">
          <div className="section-title">
            <h3>Generated Options</h3>
          </div>
          <div id="generatorResultsList" className="script-list">
            {generatedScripts.map(script => (
              <ScriptCard
                key={script.uniqueId}
                script={script}
                isPinned={pinnedScripts.some(p => String(p.uniqueId) === String(script.uniqueId))}
                onTogglePin={() => togglePin(script.uniqueId)}
                onTransfer={onTransferToAdvertisers}
                onExcludeTag={handleExcludeFromResult}
                lockedTagIds={lockedTagIds}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneratorTab;
