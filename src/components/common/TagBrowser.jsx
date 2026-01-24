import { useState } from 'react';
import { useApp } from '../../context/AppContext';

// Format delta value for display
function formatDelta(value) {
  if (value === null || value === undefined) return '-';
  // Round to 1 decimal place
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return '-';
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

// Get CSS class for delta value
function getDeltaClass(value) {
  if (value === null || value === undefined) return 'delta-neutral';
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return 'delta-neutral';
  return rounded > 0 ? 'delta-positive' : 'delta-negative';
}

/**
 * TagBrowser - A vertical scrolling list of all tags organized by category.
 * Each tag is rendered as a clickable card styled after the game's tan/cream cards.
 * Categories are displayed as collapsible accordions.
 * 
 * @param {Set<string>} selectedTagIds - Currently selected tag IDs
 * @param {function} onToggle - Callback when a card is clicked: (tagId, category) => void
 * @param {'locked' | 'excluded' | 'selected'} variant - Controls styling (gold vs red vs green accents)
 * @param {Object} scoreDeltas - Optional map of tagId -> { artDelta: number, comDelta: number }
 * @param {boolean} showDeltas - Whether to show the delta row (for synergy mode)
 * @param {function} renderCategoryExtra - Optional render prop: (category) => ReactNode for extra content inside accordion
 */
function TagBrowser({ selectedTagIds, onToggle, variant = 'locked', scoreDeltas = {}, showDeltas = false, renderCategoryExtra = null }) {
  const { categories, getTagsByCategory } = useApp();
  
  // Track which categories are expanded (all start collapsed)
  const [expandedCategories, setExpandedCategories] = useState(() => 
    new Set()
  );

  const handleCardClick = (tagId, category) => {
    onToggle(tagId, category);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Count selected tags per category for the badge
  const getSelectedCount = (category) => {
    const tagsInCategory = getTagsByCategory(category);
    return tagsInCategory.filter(tag => selectedTagIds.has(tag.id)).length;
  };

  return (
    <div className="tag-browser-container">
      {categories.map(category => {
        const tagsInCategory = getTagsByCategory(category);
        
        if (tagsInCategory.length === 0) return null;

        const isExpanded = expandedCategories.has(category);
        const selectedCount = getSelectedCount(category);

        return (
          <div key={category} className="tag-browser-section">
            <button
              className={`tag-browser-accordion-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleCategory(category)}
              type="button"
            >
              <span className="accordion-title">
                {category}
                {selectedCount > 0 && (
                  <span className={`accordion-badge ${variant}`}>{selectedCount}</span>
                )}
              </span>
              <span className="accordion-icon">{isExpanded ? '−' : '+'}</span>
            </button>
            <div className={`tag-browser-cards ${isExpanded ? '' : 'collapsed'}`}>
              {tagsInCategory.map(tag => {
                const isSelected = selectedTagIds.has(tag.id);
                let selectedClass = '';
                if (isSelected) {
                  if (variant === 'locked') selectedClass = 'selected-locked';
                  else if (variant === 'excluded') selectedClass = 'selected-excluded';
                  else if (variant === 'selected') selectedClass = 'selected-selected';
                }

                // Get score deltas for this tag
                const deltas = scoreDeltas[tag.id];
                const artDelta = deltas?.artDelta;
                const comDelta = deltas?.comDelta;

                // Determine outline class based on combined deltas
                let outlineClass = '';
                if (!isSelected && deltas) {
                  const artPositive = artDelta >= 0.05;
                  const artNegative = artDelta <= -0.05;
                  const comPositive = comDelta >= 0.05;
                  const comNegative = comDelta <= -0.05;
                  
                  if (artPositive && comPositive) {
                    outlineClass = 'tag-both-positive';
                  } else if (artNegative && comNegative) {
                    outlineClass = 'tag-both-negative';
                  }
                }

                return (
                  <button
                    key={tag.id}
                    className={`tag-browser-card ${selectedClass} ${outlineClass} ${showDeltas ? 'has-deltas' : ''}`.trim()}
                    onClick={() => handleCardClick(tag.id, category)}
                    type="button"
                  >
                    <span className="tag-name">{tag.name}</span>
                    {showDeltas && (
                      <span className="tag-deltas">
                        <span className={`tag-delta ${getDeltaClass(artDelta)}`}>
                          A: {formatDelta(artDelta)}
                        </span>
                        <span className={`tag-delta ${getDeltaClass(comDelta)}`}>
                          C: {formatDelta(comDelta)}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
              {renderCategoryExtra && renderCategoryExtra(category)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TagBrowser;
