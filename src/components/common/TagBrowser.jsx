import { useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * TagBrowser - A vertical scrolling list of all tags organized by category.
 * Each tag is rendered as a clickable card styled after the game's tan/cream cards.
 * Categories are displayed as collapsible accordions.
 * 
 * @param {Set<string>} selectedTagIds - Currently selected tag IDs
 * @param {function} onToggle - Callback when a card is clicked: (tagId, category) => void
 * @param {'locked' | 'excluded' | 'selected'} variant - Controls styling (gold vs red vs green accents)
 * @param {function} renderCategoryExtra - Optional render prop: (category) => ReactNode for extra content inside accordion
 */
function TagBrowser({ selectedTagIds, onToggle, variant = 'locked', renderCategoryExtra = null }) {
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

                return (
                  <button
                    key={tag.id}
                    className={`tag-browser-card ${selectedClass}`}
                    onClick={() => handleCardClick(tag.id, category)}
                    type="button"
                  >
                    {tag.name}
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
