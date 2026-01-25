import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MULTI_SELECT_CATEGORIES } from '../../data/gameData';
import Button from './Button';

function CategorySelector({
  category,
  selectedTags,
  onTagsChange,
  genrePercents = {},
  onGenrePercentChange = null,
  context = 'default',
  isExcluded = false,
  scoreDeltas = {}
}) {
  const { getTagsByCategory } = useApp();
  const tagsInCategory = getTagsByCategory(category);

  // In excluded context, ALL categories can have multiple selections
  const isMultiSelect = isExcluded || MULTI_SELECT_CATEGORIES.includes(category);
  const categoryTags = selectedTags.filter(t => t.category === category);

  const addDropdown = (selectedId = null) => {
    const newTag = selectedId ? { id: selectedId, category } : { id: '', category };
    onTagsChange([...selectedTags, newTag]);
  };

  const updateTag = (index, newId) => {
    // Find the actual index in the full selectedTags array
    let count = -1;
    let actualIndex = -1;
    for (let i = 0; i < selectedTags.length; i++) {
      if (selectedTags[i].category === category) {
        count++;
        if (count === index) {
          actualIndex = i;
          break;
        }
      }
    }
    
    if (actualIndex !== -1) {
      // Tag exists, update it
      const newTags = [...selectedTags];
      newTags[actualIndex] = { ...newTags[actualIndex], id: newId };
      onTagsChange(newTags);
    } else if (index === 0 && categoryTags.length === 0) {
      // This is the fallback empty dropdown - add a new tag
      if (newId) {
        onTagsChange([...selectedTags, { id: newId, category }]);
      }
    }
  };

  const removeTag = (index) => {
    let count = -1;
    let actualIndex = -1;
    for (let i = 0; i < selectedTags.length; i++) {
      if (selectedTags[i].category === category) {
        count++;
        if (count === index) {
          actualIndex = i;
          break;
        }
      }
    }
    
    if (actualIndex !== -1) {
      const newTags = selectedTags.filter((_, i) => i !== actualIndex);
      onTagsChange(newTags);
    }
  };

  const handlePercentChange = (tagId, value) => {
    if (onGenrePercentChange) {
      onGenrePercentChange(tagId, value);
    }
  };

  const showPercentSlider = category === 'Genre' && !isExcluded && categoryTags.filter(t => t.id).length > 1;

  // If no tags for this category yet, show at least one empty dropdown
  const displayTags = categoryTags.length > 0 ? categoryTags : [{ id: '', category }];

  return (
    <div 
      className="category-group" 
      id={`group-${category.replace(/\s/g, '-')}-${context}`}
    >
      <div className="category-header">
        <div className="category-label">{category}</div>
        {isMultiSelect && (
          <Button
            size="icon"
            onClick={() => addDropdown()}
          >
            +
          </Button>
        )}
      </div>
      
      <div className="inputs-container" id={`inputs-${category.replace(/\s/g, '-')}-${context}`}>
        {displayTags.map((tag, index) => (
          <div 
            key={`${category}-${index}-${tag.id || 'empty'}`} 
            className={`select-row ${category === 'Genre' && !isExcluded ? 'genre-row' : ''}`}
          >
            <select
              className="tag-selector"
              data-category={category}
              value={tag.id}
              onChange={(e) => updateTag(index, e.target.value)}
            >
              <option value="">-- Select {category} --</option>
              {tagsInCategory.map(t => {
                // Add delta info to dropdown options
                const deltas = scoreDeltas[t.id];
                let suffix = '';
                if (deltas) {
                  const artStr = deltas.artDelta >= 0.05 ? `+${deltas.artDelta.toFixed(1)}` 
                    : deltas.artDelta <= -0.05 ? deltas.artDelta.toFixed(1) : '-';
                  const comStr = deltas.comDelta >= 0.05 ? `+${deltas.comDelta.toFixed(1)}`
                    : deltas.comDelta <= -0.05 ? deltas.comDelta.toFixed(1) : '-';
                  suffix = ` (A:${artStr} C:${comStr})`;
                }
                return (
                  <option key={t.id} value={t.id}>{t.name}{suffix}</option>
                );
              })}
            </select>
            
            {showPercentSlider && tag.id && (
              <GenrePercentSlider
                tagId={tag.id}
                value={genrePercents[tag.id] ?? 100}
                onChange={(val) => handlePercentChange(tag.id, val)}
              />
            )}
            
            {isMultiSelect && displayTags.length > 1 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeTag(index)}
              >
                ×
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenrePercentSlider({ tagId, value, onChange }) {
  const sliderRef = useRef(null);

  useEffect(() => {
    if (sliderRef.current) {
      const color = '#d4af37';
      sliderRef.current.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #444 ${value}%, #444 100%)`;
    }
  }, [value]);

  return (
    <div className="genre-percent-wrapper">
      <input
        ref={sliderRef}
        type="range"
        className="styled-slider percent-slider"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <input
        type="number"
        className="percent-input"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
      <span style={{ fontSize: '0.8rem', color: '#888' }}>%</span>
    </div>
  );
}

export default CategorySelector;
