import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useSynergyCalculation } from '../../hooks/useSynergyCalculation';
import { useScriptGeneratorContext } from '../../context/ScriptGeneratorContext';
import { useAudienceAnalysis } from '../../hooks/useAudienceAnalysis';
import { MULTI_SELECT_CATEGORIES } from '../../data/gameData';
import LayoutCard from '../common/LayoutCard';
import Button from '../common/Button';
import QuickSearchCard from '../common/QuickSearchCard';
import CategorySelector from '../common/CategorySelector';
import TagBrowser from '../common/TagBrowser';
import SynergyResults from './SynergyResults';
import { collectTagInputs, calculateScoreDeltas } from '../../utils/tagHelpers';

// Genre percentage slider component for browse mode
function GenreSlider({ tagId, tagName, value, onChange }) {
  const sliderRef = useRef(null);

  useEffect(() => {
    if (sliderRef.current) {
      const color = '#4cd964';
      sliderRef.current.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #444 ${value}%, #444 100%)`;
    }
  }, [value]);

  const handleNumberChange = (e) => {
    const rawValue = parseInt(e.target.value) || 0;
    const snappedValue = Math.round(rawValue / 5) * 5;
    onChange(tagId, Math.max(0, Math.min(100, snappedValue)));
  };

  return (
    <div className="browser-genre-slider">
      <span className="genre-slider-label">{tagName}</span>
      <div className="genre-percent-wrapper">
        <input
          ref={sliderRef}
          type="range"
          className="styled-slider percent-slider"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(tagId, parseInt(e.target.value))}
        />
        <input
          type="number"
          className="percent-input"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={handleNumberChange}
        />
        <span style={{ fontSize: '0.8rem', color: '#888' }}>%</span>
      </div>
    </div>
  );
}

function SynergyTab({ onTransferToAdvertisers = null }) {
  const { categories, isLoading, tags, compatibility, maxTagSlots, ownedTagIds, tagFreshness, freshnessIncludeUnreleased, toggleFreshnessIncludeUnreleased } = useApp();
  const { calculateSynergy } = useSynergyCalculation();
  const { analyzeMovie } = useAudienceAnalysis();
  const { pinScript } = useScriptGeneratorContext();
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [genrePercents, setGenrePercents] = useState({});
  const [results, setResults] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [inputMode, setInputMode] = useState('browser'); // 'dropdown' | 'browser'

  // Calculate audience data when results are available
  const audienceData = useMemo(() => {
    if (!results) return null;
    const tagInputs = collectTagInputs(
      selectedTags.filter(t => t.id),
      genrePercents
    );
    return analyzeMovie(tagInputs, results.displayCom, results.displayArt);
  }, [results, selectedTags, genrePercents, analyzeMovie]);

  // Memoized Set for TagBrowser
  const selectedTagIds = useMemo(() => 
    new Set(selectedTags.filter(t => t.id).map(t => t.id)), 
    [selectedTags]
  );

  // Compute score deltas for all tags (what would happen if each tag were added)
  const scoreDeltas = useMemo(() => {
    const currentInputs = collectTagInputs(
      selectedTags.filter(t => t.id),
      genrePercents
    );
    
    // Need at least one tag to calculate deltas
    if (currentInputs.length === 0) {
      return {};
    }
    
    // Calculate baseline scores
    const baselineResult = calculateSynergy(currentInputs);
    const baselineArt = baselineResult?.displayArt ?? 0;
    const baselineCom = baselineResult?.displayCom ?? 0;
    
    // Calculate deltas for all tags
    return calculateScoreDeltas(
      currentInputs,
      tags,
      baselineArt,
      baselineCom,
      calculateSynergy
    );
  }, [selectedTags, genrePercents, tags, calculateSynergy]);

  // Get selected genres with their names for the sliders
  const selectedGenres = useMemo(() => {
    return selectedTags
      .filter(t => t.category === 'Genre' && t.id)
      .map(t => ({
        id: t.id,
        name: tags[t.id]?.name || t.id
      }));
  }, [selectedTags, tags]);

  // Auto-initialize to 50/50 when exactly 2 genres are selected
  const prevGenreCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevGenreCountRef.current;
    const currentCount = selectedGenres.length;
    prevGenreCountRef.current = currentCount;
    
    // When transitioning to exactly 2 genres, initialize both to 50%
    if (currentCount === 2 && prevCount !== 2) {
      setGenrePercents(prev => {
        const newPercents = { ...prev };
        selectedGenres.forEach(genre => {
          newPercents[genre.id] = 50;
        });
        return newPercents;
      });
    }
  }, [selectedGenres]);

  // Calculate genre percentage sum for validation
  const genrePercentSum = useMemo(() => {
    if (selectedGenres.length <= 1) return 100;
    return selectedGenres.reduce((sum, genre) => {
      return sum + (genrePercents[genre.id] ?? 50);
    }, 0);
  }, [selectedGenres, genrePercents]);

  // Validation: require Genre, Setting, Protagonist, and valid genre percentages
  const validation = useMemo(() => {
    const hasGenre = selectedTags.some(t => t.category === 'Genre' && t.id);
    const hasSetting = selectedTags.some(t => t.category === 'Setting' && t.id);
    const hasProtagonist = selectedTags.some(t => t.category === 'Protagonist' && t.id);
    const hasValidPercents = genrePercentSum === 100;
    
    const missing = [
      !hasGenre && 'Genre',
      !hasSetting && 'Setting', 
      !hasProtagonist && 'Protagonist'
    ].filter(Boolean);
    
    return {
      isValid: hasGenre && hasSetting && hasProtagonist && hasValidPercents,
      hasCoreRequirements: hasGenre && hasSetting && hasProtagonist,
      hasValidPercents,
      missing
    };
  }, [selectedTags, genrePercentSum]);

  // Initialize - empty array for browser mode, empty tags per category for dropdown
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (inputMode === 'dropdown') {
        const initialTags = categories.map(cat => ({ id: '', category: cat }));
        setSelectedTags(initialTags);
      } else {
        setSelectedTags([]);
      }
      setInitialized(true);
    }
  }, [isLoading, initialized, categories, inputMode]);

  const handleSearchSelect = useCallback((tag) => {
    setSelectedTags(prev => {
      // Check if tag already exists
      const exists = prev.some(t => t.id === tag.id && t.id !== '');
      if (exists) return prev;
      
      // Find first empty slot in this category
      const emptyIndex = prev.findIndex(t => t.category === tag.category && t.id === '');
      if (emptyIndex !== -1) {
        const newTags = [...prev];
        newTags[emptyIndex] = { id: tag.id, category: tag.category };
        return newTags;
      }
      
      // Add new tag
      return [...prev, { id: tag.id, category: tag.category }];
    });
  }, []);

  const handleGenrePercentChange = useCallback((tagId, value) => {
    setGenrePercents(prev => {
      const newPercents = { ...prev, [tagId]: value };
      
      // Auto-balance when exactly 2 genres are selected
      if (selectedGenres.length === 2) {
        const otherGenre = selectedGenres.find(g => g.id !== tagId);
        if (otherGenre) {
          newPercents[otherGenre.id] = 100 - value;
        }
      }
      
      return newPercents;
    });
  }, [selectedGenres]);

  // Categories that count toward the element limit (excludes Genre, Setting, and Protagonist)
  const ELEMENT_CATEGORIES = ['Antagonist', 'Supporting Character', 'Theme & Event', 'Finale'];
  // Max optional elements = maxTagSlots - 1 (Protagonist takes 1 slot)
  // maxTagSlots defaults to 10 when no save loaded, so MAX_ELEMENTS defaults to 9
  const MAX_ELEMENTS = maxTagSlots - 1;

  // Toggle handler for TagBrowser
  const handleTagToggle = useCallback((tagId, category) => {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.id === tagId);
      
      if (exists) {
        // Remove the tag - always allowed
        return prev.filter(t => t.id !== tagId);
      } else {
        // Check if this is an element category (not Genre/Setting) and we're at max
        if (ELEMENT_CATEGORIES.includes(category)) {
          const currentElementCount = prev.filter(t => 
            t.id && ELEMENT_CATEGORIES.includes(t.category)
          ).length;
          
          // For SINGLE-SELECT element categories (Antagonist, Finale), 
          // we're replacing not adding, so allow it even at max.
          // For MULTI-SELECT categories (Supporting Character, Theme & Event), we're truly adding.
          const isSingleSelect = !MULTI_SELECT_CATEGORIES.includes(category);
          const hasExistingInCategory = prev.some(t => t.category === category && t.id);
          const isReplacing = isSingleSelect && hasExistingInCategory;
          
          // Block if we're at max AND not replacing an existing single-select selection
          // Use maxTagSlots directly to avoid stale closure
          const maxElements = maxTagSlots - 1;
          if (currentElementCount >= maxElements && !isReplacing) {
            return prev; // Don't add, at max
          }
        }
        
        // For single-select categories, replace existing selection
        if (!MULTI_SELECT_CATEGORIES.includes(category)) {
          return [...prev.filter(t => t.category !== category), { id: tagId, category }];
        }
        // For multi-select categories, just add the tag
        return [...prev, { id: tagId, category }];
      }
    });
  }, [maxTagSlots]);

  const handleCalculate = () => {
    const tagInputs = collectTagInputs(
      selectedTags.filter(t => t.id),
      genrePercents
    );
    
    if (tagInputs.length === 0) {
      alert("Please select at least one tag.");
      return;
    }

    const result = calculateSynergy(tagInputs);
    setResults(result);
  };

  const handleReset = useCallback(() => {
    if (inputMode === 'dropdown') {
      const initialTags = categories.map(cat => ({ id: '', category: cat }));
      setSelectedTags(initialTags);
    } else {
      setSelectedTags([]);
    }
    setGenrePercents({});
    setResults(null);
  }, [inputMode, categories]);

  // Reset form when save is loaded or unloaded
  const prevSaveLoadedRef = useRef(ownedTagIds !== null);
  useEffect(() => {
    const saveLoaded = ownedTagIds !== null;
    if (prevSaveLoadedRef.current !== saveLoaded) {
      prevSaveLoadedRef.current = saveLoaded;
      handleReset();
    }
  }, [ownedTagIds, handleReset]);

  // Auto-calculate in browser mode when validation passes
  useEffect(() => {
    if (inputMode === 'browser') {
      if (validation.isValid) {
        const tagInputs = collectTagInputs(
          selectedTags.filter(t => t.id),
          genrePercents
        );
        const result = calculateSynergy(tagInputs);
        setResults(result);
      } else {
        // Clear results when validation fails
        setResults(null);
      }
    }
  }, [inputMode, validation.isValid, selectedTags, genrePercents, calculateSynergy]);

  const handleTransfer = () => {
    if (onTransferToAdvertisers) {
      const tagInputs = collectTagInputs(
        selectedTags.filter(t => t.id),
        genrePercents
      );
      onTransferToAdvertisers(tagInputs, genrePercents);
    }
  };

  // Create a script object from current synergy results for pinning
  const createScriptFromSynergy = useCallback(() => {
    if (!results || !validation.isValid) return null;
    
    const tagInputs = collectTagInputs(
      selectedTags.filter(t => t.id),
      genrePercents
    );
    
    // Calculate script quality based on scoring elements
    let maxScriptQuality = 5;
    if (results.ngCount >= 9) maxScriptQuality = 8;
    else if (results.ngCount >= 7) maxScriptQuality = 7;
    else if (results.ngCount >= 5) maxScriptQuality = 6;
    
    const movieScore = Math.max(results.displayCom, results.displayArt);
    
    return {
      tags: tagInputs,
      stats: {
        avgComp: results.rawAverage,
        synergySum: results.totalScore,
        maxScriptQuality,
        movieScore: movieScore.toFixed(1)
      },
      uniqueId: Date.now() + Math.random().toString(),
      name: ''
    };
  }, [results, validation.isValid, selectedTags, genrePercents]);

  // Pin current synergy script
  const handlePinScript = useCallback(() => {
    const script = createScriptFromSynergy();
    if (script) {
      pinScript(script);
    }
  }, [createScriptFromSynergy, pinScript]);

  if (isLoading || !initialized) {
    return null;
  }

  return (
    <div id="tab-synergy" className="tab-content active">
      <div className="split-layout">
        {/* Left Column - Form */}
        <div className="split-layout-left">
          <QuickSearchCard onSelect={handleSearchSelect} />

          <LayoutCard 
            className="builder-card"
            title="Check Compatibility"
            subtitle={
              <>
                Select story elements to see how well they fit together.
                {ownedTagIds && <span> Max optional elements: {maxTagSlots - 1}.</span>}
              </>
            }
            headerActions={
              <>
                <Button
                  size="sm"
                  onClick={() => setInputMode(prev => prev === 'dropdown' ? 'browser' : 'dropdown')}
                  title={inputMode === 'dropdown' ? 'Browse Mode' : 'Dropdown Mode'}
                />
                <Button size="sm" variant="primary" onClick={handleReset} title="Reset" />
              </>
            }
          >
            
            {inputMode === 'dropdown' ? (
              <div id="selectors-container-synergy">
                {categories.map(category => (
                  <CategorySelector
                    key={category}
                    category={category}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    genrePercents={genrePercents}
                    onGenrePercentChange={handleGenrePercentChange}
                    context="synergy"
                    scoreDeltas={scoreDeltas}
                  />
                ))}
              </div>
            ) : (
              <>
                {tagFreshness && (
                  <div className="freshness-toggle-row">
                    <label className="freshness-toggle">
                      <input
                        type="checkbox"
                        checked={freshnessIncludeUnreleased}
                        onChange={toggleFreshnessIncludeUnreleased}
                      />
                      <span className="freshness-checkbox">
                        <span className="freshness-checkmark" />
                      </span>
                      <span>Include unreleased films in staleness</span>
                    </label>
                  </div>
                )}
                <TagBrowser
                  selectedTagIds={selectedTagIds}
                  onToggle={handleTagToggle}
                  variant="selected"
                  scoreDeltas={scoreDeltas}
                  showDeltas={true}
                  showFreshness={!!tagFreshness}
                  optionalCategories={ELEMENT_CATEGORIES}
                  maxOptionalTags={MAX_ELEMENTS}
                  renderCategoryExtra={(category) => {
                    if (category === 'Genre' && selectedGenres.length > 1) {
                      return (
                        <div className="browser-genre-sliders">
                          {selectedGenres.map(genre => (
                            <GenreSlider
                              key={genre.id}
                              tagId={genre.id}
                              tagName={genre.name}
                              value={genrePercents[genre.id] ?? 50}
                              onChange={handleGenrePercentChange}
                            />
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </>
            )}
            
            {inputMode === 'dropdown' ? (
              <div className="action-area">
                <Button 
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCalculate}
                  disabled={!validation.isValid}
                  title="Check Compatibility"
                />
                {!validation.isValid && (
                  <p className="subtitle" style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                    Required: {validation.missing.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              !validation.isValid && (
                <div className="validation-messages" style={{ marginTop: '15px' }}>
                  {validation.missing.length > 0 && (
                    <p className="subtitle" style={{ color: 'var(--text-muted)', margin: '0 0 5px 0' }}>
                      Select: {validation.missing.join(', ')}
                    </p>
                  )}
                  {!validation.hasValidPercents && selectedGenres.length > 1 && (
                    <p className="subtitle" style={{ color: 'var(--danger)', margin: 0 }}>
                      Genre weights must total 100% (currently {genrePercentSum}%)
                    </p>
                  )}
                </div>
              )
            )}
          </LayoutCard>
        </div>

        {/* Right Column - Results */}
        <div className="split-layout-right">
          {results ? (
            <SynergyResults 
              results={results} 
              audienceData={audienceData}
              onTransfer={onTransferToAdvertisers ? handleTransfer : null}
              onPin={handlePinScript}
            />
          ) : (
            <div className="validation-placeholder">
              <div className="validation-placeholder-content">
                <span className="validation-status-text">
                  Results appear when story is valid:
                </span>
                <div className="validation-checklist">
                  {['Genre', 'Setting', 'Protagonist'].map(category => {
                    const hasCategory = selectedTags.some(t => t.category === category && t.id);
                    return (
                      <span 
                        key={category} 
                        className={`validation-chip ${hasCategory ? 'valid' : 'missing'}`}
                      >
                        {hasCategory ? '✓' : '○'} {category}
                      </span>
                    );
                  })}
                  {selectedGenres.length > 1 && (
                    <span className={`validation-chip ${validation.hasValidPercents ? 'valid' : 'missing'}`}>
                      {validation.hasValidPercents ? '✓' : '○'} Genres: {genrePercentSum}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default SynergyTab;
