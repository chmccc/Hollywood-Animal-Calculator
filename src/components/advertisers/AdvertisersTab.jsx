import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAudienceAnalysis } from '../../hooks/useAudienceAnalysis';
import Card from '../common/Card';
import Button from '../common/Button';
import Slider from '../common/Slider';
import SearchBar from '../common/SearchBar';
import CategorySelector from '../common/CategorySelector';
import DistributionCalculator from './DistributionCalculator';
import TargetAudience from './TargetAudience';
import HolidayList from './HolidayList';
import AdvertiserResults from './AdvertiserResults';
import { collectTagInputs } from '../../utils/tagHelpers';

const DEFAULT_OWNED_SCREENINGS = 0;

function AdvertisersTab({ initialTags = null, initialGenrePercents = null }) {
  const { categories, isLoading, ownedTagIds, ownedTheatres } = useApp();
  const { analyzeMovie, calculateDistribution } = useAudienceAnalysis();
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [genrePercents, setGenrePercents] = useState({});
  const [comScore, setComScore] = useState(5.0);
  const [artScore, setArtScore] = useState(5.0);
  const [results, setResults] = useState(null);
  const [ownedScreenings, setOwnedScreenings] = useState(() => {
    // Initialize from context if save is loaded, otherwise use default
    return ownedTheatres ?? DEFAULT_OWNED_SCREENINGS;
  });
  const [initialized, setInitialized] = useState(false);

  // Initialize with one empty tag per category
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (initialTags && initialTags.length > 0) {
        // Use initial tags from transfer
        const tagMap = new Map();
        categories.forEach(cat => tagMap.set(cat, []));
        
        initialTags.forEach(t => {
          if (tagMap.has(t.category)) {
            tagMap.get(t.category).push({ id: t.id, category: t.category });
          }
        });
        
        // Ensure at least one slot per category
        const allTags = [];
        categories.forEach(cat => {
          const catTags = tagMap.get(cat);
          if (catTags.length > 0) {
            allTags.push(...catTags);
          } else {
            allTags.push({ id: '', category: cat });
          }
        });
        
        setSelectedTags(allTags);
        if (initialGenrePercents) {
          setGenrePercents(initialGenrePercents);
        }
      } else {
        const initialTagsList = categories.map(cat => ({ id: '', category: cat }));
        setSelectedTags(initialTagsList);
      }
      setInitialized(true);
    }
  }, [isLoading, initialized, categories, initialTags, initialGenrePercents]);

  const handleSearchSelect = useCallback((tag) => {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.id === tag.id && t.id !== '');
      if (exists) return prev;
      
      const emptyIndex = prev.findIndex(t => t.category === tag.category && t.id === '');
      if (emptyIndex !== -1) {
        const newTags = [...prev];
        newTags[emptyIndex] = { id: tag.id, category: tag.category };
        return newTags;
      }
      
      return [...prev, { id: tag.id, category: tag.category }];
    });
  }, []);

  const handleGenrePercentChange = useCallback((tagId, value) => {
    setGenrePercents(prev => ({ ...prev, [tagId]: value }));
  }, []);

  const handleAnalyze = () => {
    const tagInputs = collectTagInputs(
      selectedTags.filter(t => t.id),
      genrePercents
    );
    
    if (tagInputs.length === 0) {
      alert("Please select at least one tag.");
      return;
    }

    const result = analyzeMovie(tagInputs, comScore, artScore);
    setResults(result);
  };

  const handleReset = useCallback(() => {
    const initialTagsList = categories.map(cat => ({ id: '', category: cat }));
    setSelectedTags(initialTagsList);
    setGenrePercents({});
    setResults(null);
  }, [categories]);

  // Reset form when save is loaded or unloaded
  const prevSaveLoadedRef = useRef(ownedTagIds !== null);
  useEffect(() => {
    const saveLoaded = ownedTagIds !== null;
    if (prevSaveLoadedRef.current !== saveLoaded) {
      prevSaveLoadedRef.current = saveLoaded;
      handleReset();
      // Update owned screenings based on save state
      if (saveLoaded && ownedTheatres !== null) {
        setOwnedScreenings(ownedTheatres);
      } else {
        setOwnedScreenings(DEFAULT_OWNED_SCREENINGS);
      }
    }
  }, [ownedTagIds, ownedTheatres, handleReset]);

  const distributionResults = calculateDistribution(comScore, ownedScreenings);

  if (isLoading || !initialized) {
    return <div>Loading...</div>;
  }

  return (
    <div id="tab-advertisers" className="tab-content">
      <div className="split-layout">
        {/* Left Column - Form */}
        <div className="split-layout-left">
          <Card className="search-card">
            <h3>Quick Search</h3>
            <SearchBar
              onSelect={handleSearchSelect}
              placeholder="Type to find a tag (e.g., 'Action', 'Cowboy')..."
            />
          </Card>

          <Card className="score-card">
            <div className="card-header">
              <h3>Movie Scores</h3>
              <span className="score-help">0 - 10</span>
            </div>
            <div className="score-controls-wrapper">
              <Slider
                label="Commercial"
                value={comScore}
                onChange={setComScore}
                min={0}
                max={10}
                step={0.1}
                sliderClass="com-slider"
                color="#d4af37"
              />
              <Slider
                label="Art"
                value={artScore}
                onChange={setArtScore}
                min={0}
                max={10}
                step={0.1}
                sliderClass="art-slider"
                color="#a0a0ff"
              />
            </div>
          </Card>

          <Card className="builder-card">
            <div className="card-header">
              <h3>Build Your Script</h3>
              <Button size="sm" variant="primary" onClick={handleReset} title="Reset" />
            </div>
            <p className="subtitle">Select tags manually or use the search bar above. Add multiple genres to adjust their influence.</p>
            
            <div id="selectors-container-advertisers">
              {categories.map(category => (
                <CategorySelector
                  key={category}
                  category={category}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  genrePercents={genrePercents}
                  onGenrePercentChange={handleGenrePercentChange}
                  context="advertisers"
                />
              ))}
            </div>
            
            <div className="action-area">
              <Button variant="primary" size="lg" fullWidth onClick={handleAnalyze} title="Analyse" />
            </div>
          </Card>

          {/* Distribution Calculator (always visible) */}
          <DistributionCalculator
            comScore={comScore}
            ownedScreenings={ownedScreenings}
            onOwnedScreeningsChange={setOwnedScreenings}
            distributionResults={distributionResults}
            isFromSave={ownedTheatres !== null && ownedScreenings === ownedTheatres}
          />
        </div>

        {/* Right Column - Results */}
        <div className="split-layout-right">
          {results && (
            <div id="results-advertisers" className="results-container">
              <TargetAudience
                targetAudiences={results.targetAudiences}
                thresholds={results.thresholds}
              />
              
              <HolidayList viableHolidays={results.viableHolidays} />
              
              <div className="results-row">
                <AdvertiserResults
                  validAgents={results.validAgents}
                  movieLean={results.movieLean}
                  leanText={results.leanText}
                  hasTargetAudience={results.targetAudiences.length > 0}
                />
                
                <Card className="result-card strategy-card">
                  <h3>Recommended Advertisement Duration</h3>
                  <div id="campaignStrategyDisplay">
                    <div className="strategy-row">
                      <div className="campaign-block pre">
                        <span className="camp-title">Pre-Release</span>
                        <span className="camp-value">{results.campaign.preDuration} wks</span>
                      </div>
                      <div className="campaign-block release">
                        <span className="camp-title">Release</span>
                        <span className="camp-value">{results.campaign.releaseDuration} wks</span>
                      </div>
                      <div 
                        className="campaign-block post" 
                        style={{ opacity: results.campaign.postDuration > 0 ? 1 : 0.3 }}
                      >
                        <span className="camp-title">Post-Release</span>
                        <span className="camp-value">{results.campaign.postDuration} wks</span>
                      </div>
                    </div>
                    <div className="total-duration-footer">
                      Total Duration: <strong style={{ color: '#fff' }}>{results.campaign.totalWeeks} Weeks</strong>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvertisersTab;
