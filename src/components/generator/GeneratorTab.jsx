import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useScriptGeneratorContext } from '../../context/ScriptGeneratorContext';
import LayoutCard from '../common/LayoutCard';
import Button from '../common/Button';
import Slider from '../common/Slider';
import CategorySelector from '../common/CategorySelector';
import TagBrowser from '../common/TagBrowser';
import ScriptCard from './ScriptCard';
import { collectTagInputs } from '../../utils/tagHelpers';

const STALENESS_MAX_VALUE = 6;
const MAX_ACTORS_NO_LIMIT = 9;

function GeneratorTab({ onTransferToAdvertisers = null }) {
  const { categories, ownedTagIds, maxTagSlots, tagFreshness, codexBannedTags, freshnessIncludeUnreleased, toggleFreshnessIncludeUnreleased } = useApp();
  const {
    generatedScripts,
    pinnedScripts,
    generateScripts,
    togglePin
  } = useScriptGeneratorContext();

  const [targetComp, setTargetComp] = useState(4.0);
  const [targetScore, setTargetScore] = useState(6);
  const [lockedTags, setLockedTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [genrePercents, setGenrePercents] = useState({});
  const [lockedInputMode, setLockedInputMode] = useState('browser'); // 'dropdown' | 'browser'
  const [excludedInputMode, setExcludedInputMode] = useState('browser'); // 'dropdown' | 'browser'
  const [maxStaleness, setMaxStaleness] = useState(STALENESS_MAX_VALUE);
  const [maxActors, setMaxActors] = useState(MAX_ACTORS_NO_LIMIT);
  const [excludeBanned, setExcludeBanned] = useState(true);

  // Load exclusions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('excludedTags');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExcludedTags(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved exclusions:', e);
      }
    }
  }, []);

  const lockedTagIds = useMemo(() => 
    new Set(lockedTags.filter(t => t.id).map(t => t.id)), 
    [lockedTags]
  );

  const excludedTagIds = useMemo(() => 
    new Set(excludedTags.filter(t => t.id).map(t => t.id)), 
    [excludedTags]
  );

  const lockedCount = lockedTags.filter(t => t.id).length;
  const excludedCount = excludedTags.filter(t => t.id).length;

  const handleGenrePercentChange = useCallback((tagId, value) => {
    setGenrePercents(prev => ({ ...prev, [tagId]: value }));
  }, []);

  const handleGenerate = () => {
    const fixedTags = collectTagInputs(
      lockedTags.filter(t => t.id),
      genrePercents
    );

    let allExcluded = excludedTags.filter(t => t.id);
    if (excludeBanned && codexBannedTags && codexBannedTags.size > 0) {
      const alreadyExcluded = new Set(allExcluded.map(t => t.id));
      codexBannedTags.forEach(id => {
        if (!alreadyExcluded.has(id)) {
          allExcluded.push({ id, percent: 1.0, category: 'Unknown' });
        }
      });
    }

    const excluded = collectTagInputs(allExcluded, {});
    const stalenessLimit = maxStaleness < STALENESS_MAX_VALUE ? maxStaleness : null;
    const actorsLimit = maxActors < MAX_ACTORS_NO_LIMIT ? maxActors : null;
    const result = generateScripts(targetComp, targetScore, fixedTags, excluded, stalenessLimit, actorsLimit);
    if (result.error) {
      alert(result.error);
    }
  };

  const handleResetLocks = () => {
    setLockedTags([]);
    setGenrePercents({});
  };

  const handleResetExcluded = () => {
    // Clear localStorage when resetting
    localStorage.removeItem('excludedTags');
    setExcludedTags([]);
  };

  // Reset locked tags when save is loaded or unloaded
  const prevSaveLoadedRef = useRef(ownedTagIds !== null);
  useEffect(() => {
    const saveLoaded = ownedTagIds !== null;
    if (prevSaveLoadedRef.current !== saveLoaded) {
      prevSaveLoadedRef.current = saveLoaded;
      // Reset locks - they may reference invalid tags from old save
      setLockedTags([]);
      setGenrePercents({});
    }
  }, [ownedTagIds]);

  const handleSaveExclusions = () => {
    localStorage.setItem('excludedTags', JSON.stringify(excludedTags));
    alert(`Saved ${excludedTags.length} exclusion${excludedTags.length !== 1 ? 's' : ''} to local storage.`);
  };

  const handleLockedTagToggle = useCallback((tagId, category) => {
    setLockedTags(prev => {
      const exists = prev.some(t => t.id === tagId);
      if (exists) {
        return prev.filter(t => t.id !== tagId);
      } else {
        return [...prev, { id: tagId, category }];
      }
    });
  }, []);

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

  const getRequiredTagsText = () => {
    let requiredTags = 4;
    if (targetScore <= 6) requiredTags = 4;
    else if (targetScore === 7) requiredTags = 6;
    else if (targetScore === 8) requiredTags = 8;
    else if (targetScore === 9) requiredTags = 9;
    else if (targetScore === 10) requiredTags = 10;
    
    // Cap at research limit
    const effectiveTags = Math.min(requiredTags, maxTagSlots);
    const isLimited = requiredTags > maxTagSlots;
    
    return isLimited 
      ? `Requires ~${requiredTags} elements, limited to ${maxTagSlots} by research.`
      : `Requires ~${effectiveTags} Story Elements (max ${maxTagSlots} from research).`;
  };

  return (
    <div id="tab-generator" className="tab-content">
      <div className="split-layout">
        {/* Left Column - Form */}
        <div className="split-layout-left">
          {/* Generator Settings */}
          <LayoutCard
            className="settings-card"
            title="Generator Settings"
            subtitle="Configure target scores for script generation."
            headerActions={
              ownedTagIds && (
                <span className="save-indicator">
                  Using {ownedTagIds.size} tags from save
                </span>
              )
            }
          >
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
              <Slider
                label="Max Staleness"
                value={maxStaleness}
                onChange={setMaxStaleness}
                min={1}
                max={STALENESS_MAX_VALUE}
                step={1}
                sliderClass="staleness-slider"
                color="#cd853f"
                formatDisplay={(v) => v >= STALENESS_MAX_VALUE ? 'No Max' : String(v)}
                subtitle={
                  !tagFreshness
                    ? <span style={{ color: 'var(--text-muted)' }}>Load a save file to enable staleness filtering.</span>
                    : maxStaleness >= STALENESS_MAX_VALUE
                      ? "All elements allowed regardless of staleness."
                      : `Elements used in more than ${maxStaleness} recent movie${maxStaleness !== 1 ? 's' : ''} will be excluded.`
                }
              />
              <Slider
                label="Max Actors"
                value={maxActors}
                onChange={setMaxActors}
                min={1}
                max={MAX_ACTORS_NO_LIMIT}
                step={1}
                sliderClass="actors-slider"
                color="#7b9ec4"
                formatDisplay={(v) => v >= MAX_ACTORS_NO_LIMIT ? 'No Max' : String(v)}
                subtitle={
                  maxActors >= MAX_ACTORS_NO_LIMIT
                    ? "No limit on Protagonist, Antagonist, and Supporting Character elements."
                    : `At most ${maxActors} element${maxActors !== 1 ? 's' : ''} across Protagonist, Antagonist, and Supporting Character.`
                }
              />
            </div>
            {(tagFreshness || (codexBannedTags && codexBannedTags.size > 0)) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px' }}>
                {codexBannedTags && codexBannedTags.size > 0 && (
                  <label className="freshness-toggle">
                    <input
                      type="checkbox"
                      checked={excludeBanned}
                      onChange={() => setExcludeBanned(prev => !prev)}
                    />
                    <span className="freshness-checkbox">
                      <span className="freshness-checkmark" />
                    </span>
                    <span>Exclude banned elements ({codexBannedTags.size})</span>
                  </label>
                )}
                {tagFreshness && (
                  <label className="freshness-toggle">
                    <input
                      type="checkbox"
                      checked={freshnessIncludeUnreleased}
                      onChange={toggleFreshnessIncludeUnreleased}
                    />
                    <span className="freshness-checkbox">
                      <span className="freshness-checkmark" />
                    </span>
                    <span>Include upcoming films in staleness</span>
                  </label>
                )}
              </div>
            )}
          </LayoutCard>

          {/* Locked Elements */}
          <LayoutCard
            className="locked-card"
            title={lockedCount ? `Locked Elements (${lockedCount})` : 'Locked Elements'}
            defaultCollapsed
            subtitle={<>Select specific tags you <strong>MUST</strong> have in the script.</>}
            headerActions={
              <>
                <Button
                  size="sm"
                  onClick={() => setLockedInputMode(prev => prev === 'dropdown' ? 'browser' : 'dropdown')}
                  title={lockedInputMode === 'dropdown' ? 'Browse Mode' : 'Dropdown Mode'}
                />
                <Button size="sm" variant="primary" onClick={handleResetLocks} title="Reset Locks" />
              </>
            }
          >
            {lockedInputMode === 'dropdown' ? (
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
            ) : (
              <TagBrowser
                selectedTagIds={lockedTagIds}
                onToggle={handleLockedTagToggle}
                variant="locked"
              />
            )}
          </LayoutCard>

          {/* Excluded Elements */}
          <LayoutCard
            className="excluded-card"
            title={excludedCount ? `Excluded Elements (${excludedCount})` : 'Excluded Elements'}
            defaultCollapsed
            subtitle={<>Select tags to <strong>BAN</strong> (e.g., due to "The Code"). The generator will never pick these.</>}
            headerActions={
              <>
                <Button
                  size="sm"
                  onClick={() => setExcludedInputMode(prev => prev === 'dropdown' ? 'browser' : 'dropdown')}
                  title={excludedInputMode === 'dropdown' ? 'Browse Mode' : 'Dropdown Mode'}
                />
                <Button size="sm" variant="primary" onClick={handleSaveExclusions} title="Save" />
                <Button size="sm" variant="primary" onClick={handleResetExcluded} title="Reset" />
              </>
            }
          >
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
          </LayoutCard>

          {/* Generate Button - outside cards */}
          <div className="action-area">
            <Button variant="primary" size="lg" fullWidth onClick={handleGenerate} title="Generate Scripts" />
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="split-layout-right">
          {/* Generated Scripts */}
          {generatedScripts.length > 0 ? (
            <LayoutCard
              id="results-generator"
              title="Generated Options"
            >
              <div id="generatorResultsList" className="script-list">
                {generatedScripts.map(script => (
                  <ScriptCard
                    key={script.uniqueId}
                    script={script}
                    isPinned={pinnedScripts.some(p => String(p.uniqueId) === String(script.uniqueId))}
                    onTogglePin={() => togglePin(script.uniqueId)}
                    onTransfer={onTransferToAdvertisers}
                  />
                ))}
              </div>
            </LayoutCard>
          ) : (
            <div className="validation-placeholder">
              <div className="validation-placeholder-content">
                <span className="validation-status-text">
                  Click "Generate Scripts" to create optimized script combinations.
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default GeneratorTab;
