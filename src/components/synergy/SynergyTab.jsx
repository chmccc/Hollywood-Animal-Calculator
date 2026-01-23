import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useSynergyCalculation } from '../../hooks/useSynergyCalculation';
import Card from '../common/Card';
import SearchBar from '../common/SearchBar';
import CategorySelector from '../common/CategorySelector';
import SynergyResults from './SynergyResults';
import { collectTagInputs } from '../../utils/tagHelpers';

function SynergyTab({ onTransferToAdvertisers = null }) {
  const { categories, isLoading } = useApp();
  const { calculateSynergy } = useSynergyCalculation();
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [genrePercents, setGenrePercents] = useState({});
  const [results, setResults] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize with one empty tag per category
  useEffect(() => {
    if (!isLoading && !initialized) {
      const initialTags = categories.map(cat => ({ id: '', category: cat }));
      setSelectedTags(initialTags);
      setInitialized(true);
    }
  }, [isLoading, initialized, categories]);

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
    setGenrePercents(prev => ({ ...prev, [tagId]: value }));
  }, []);

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

  const handleReset = () => {
    const initialTags = categories.map(cat => ({ id: '', category: cat }));
    setSelectedTags(initialTags);
    setGenrePercents({});
    setResults(null);
  };

  const handleTransfer = () => {
    if (onTransferToAdvertisers) {
      const tagInputs = collectTagInputs(
        selectedTags.filter(t => t.id),
        genrePercents
      );
      onTransferToAdvertisers(tagInputs, genrePercents);
    }
  };

  if (isLoading || !initialized) {
    return <div>Loading...</div>;
  }

  return (
    <div id="tab-synergy" className="tab-content active">
      <Card className="search-card">
        <h3>Quick Search</h3>
        <SearchBar
          onSelect={handleSearchSelect}
          placeholder="Type to find a tag (e.g., 'Action', 'Cowboy')..."
        />
      </Card>

      <Card className="builder-card">
        <div className="card-header">
          <h3>Check Compatibility</h3>
          <button className="reset-btn" onClick={handleReset}>Reset</button>
        </div>
        <p className="subtitle">Select story elements to see how well they fit together.</p>
        
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
            />
          ))}
        </div>
        
        <div className="action-area">
          <button className="analyze-btn" onClick={handleCalculate}>
            Check Compatibility
          </button>
        </div>
      </Card>

      {results && (
        <SynergyResults 
          results={results} 
          onTransfer={onTransferToAdvertisers ? handleTransfer : null}
        />
      )}
    </div>
  );
}

export default SynergyTab;
