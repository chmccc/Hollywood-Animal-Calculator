import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MULTI_SELECT_CATEGORIES } from '../../data/gameData';
import { getTagFreshnessInfo, getFreshnessColorClass, FRESHNESS_THRESHOLDS } from '../../utils/freshness';

// Format delta value for display
function formatDelta(value) {
  if (value === null || value === undefined) return '-';
  // Round to 1 decimal place
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return '-';
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

// Format compact bonus delta (e.g., "C+0.1" or "A-0.2")
function formatCompactBonus(prefix, value) {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 100) / 100; // 2 decimal places for raw bonus
  if (Math.abs(rounded) < 0.005) return null;
  const sign = rounded > 0 ? '+' : '';
  return `${prefix}${sign}${rounded.toFixed(2)}`;
}

// Get CSS class for delta value
function getDeltaClass(value) {
  if (value === null || value === undefined) return 'delta-neutral';
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return 'delta-neutral';
  return rounded > 0 ? 'delta-positive' : 'delta-negative';
}

// Get CSS class for raw bonus values (smaller threshold)
function getBonusDeltaClass(value) {
  if (value === null || value === undefined) return 'delta-neutral';
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded) < 0.005) return 'delta-neutral';
  return rounded > 0 ? 'delta-positive' : 'delta-negative';
}

/**
 * FreshnessMeter - Displays staleness as pips (0-6+)
 * Lower = fresher (green), higher = staler (orange/red)
 */
function FreshnessMeter({ count, status }) {
  // Show 7 pips (0-6+), filled based on count
  const maxPips = 7;
  const filledPips = Math.min(count, maxPips);
  const colorClass = getFreshnessColorClass(status);
  
  return (
    <div className={`freshness-meter ${colorClass}`} title={`${count} movie${count !== 1 ? 's' : ''} in last 500 days`}>
      {Array.from({ length: maxPips }, (_, i) => (
        <span 
          key={i} 
          className={`freshness-pip ${i < filledPips ? 'filled' : ''} ${i >= FRESHNESS_THRESHOLDS.STALE_MAX + 1 ? 'rotten-zone' : i >= FRESHNESS_THRESHOLDS.FRESH_MAX + 1 ? 'stale-zone' : ''}`}
        />
      ))}
    </div>
  );
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
 * @param {string[]} optionalCategories - Optional list of category names that count toward the optional tag limit
 * @param {number} maxOptionalTags - Optional maximum number of tags allowed from optional categories (default: 10)
 * @param {boolean} showFreshness - Whether to show the freshness meter on cards
 */
function TagBrowser({ selectedTagIds, onToggle, variant = 'locked', scoreDeltas = {}, showDeltas = false, renderCategoryExtra = null, optionalCategories = [], maxOptionalTags = 10, showFreshness = false }) {
  const { categories, getTagsByCategory, tags, codexBannedTags, tagFreshness, showBonusEffects, showAudienceEffects } = useApp();
  
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

  // Count total selected tags in optional categories
  const optionalTagCount = optionalCategories.length > 0 
    ? Array.from(selectedTagIds).filter(tagId => {
        const tag = tags[tagId];
        return tag && optionalCategories.includes(tag.category);
      }).length
    : 0;

  // Check if element categories are at max capacity
  const isAtMaxElements = optionalCategories.length > 0 && optionalTagCount >= maxOptionalTags;

  return (
    <div className="tag-browser-container">
      {isAtMaxElements && (
        <div className="tag-browser-warning">
          Maximum {maxOptionalTags} elements selected
        </div>
      )}
      {categories.map(category => {
        const tagsInCategory = getTagsByCategory(category);
        
        if (tagsInCategory.length === 0) return null;

        const isExpanded = expandedCategories.has(category);
        const selectedCount = getSelectedCount(category);

        // Check if this category is an element category and at max (for disabling)
        const isCategoryElement = optionalCategories.includes(category);
        // Single-select categories can still swap when at max (if they have a selection)
        const isSingleSelect = !MULTI_SELECT_CATEGORIES.includes(category);
        const canSwapInCategory = isSingleSelect && selectedCount > 0;
        const isCategoryDisabled = isCategoryElement && isAtMaxElements && !canSwapInCategory;

        return (
          <div key={category} className="tag-browser-section">
            <button
              className={`tag-browser-accordion-header ${isExpanded ? 'expanded' : ''} ${isCategoryDisabled ? 'category-disabled' : ''}`}
              onClick={() => toggleCategory(category)}
              type="button"
            >
              <span className="accordion-title">
                {category}
                {selectedCount > 0 && (
                  <span className={`accordion-badge ${variant}`}>{selectedCount}</span>
                )}
                {isCategoryDisabled && selectedCount === 0 && (
                  <span className="accordion-badge disabled">max</span>
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
                const synergyDelta = deltas?.synergyDelta;
                const comBonusDelta = deltas?.comBonusDelta;
                const artBonusDelta = deltas?.artBonusDelta;
                const audienceChanges = deltas?.audienceChanges || {};

                // Determine outline class based on combined deltas
                // Green: at least one positive AND neither negative
                // Red: at least one negative AND neither positive
                let outlineClass = '';
                if (!isSelected && deltas) {
                  const artPositive = artDelta >= 0.05;
                  const artNegative = artDelta <= -0.05;
                  const comPositive = comDelta >= 0.05;
                  const comNegative = comDelta <= -0.05;
                  
                  const hasPositive = artPositive || comPositive;
                  const hasNegative = artNegative || comNegative;
                  
                  if (hasPositive && !hasNegative) {
                    outlineClass = 'tag-both-positive';
                  } else if (hasNegative && !hasPositive) {
                    outlineClass = 'tag-both-negative';
                  }
                  // Mixed signals (one positive, one negative) or both neutral = no border
                }

                // Disable if category is disabled (at max, can't swap) and tag is not selected
                // Note: isCategoryDisabled already accounts for single-select swap possibility
                const isTagDisabled = isCategoryDisabled && !isSelected;

                // Check if tag is banned by the codex
                const isBanned = codexBannedTags && codexBannedTags.has(tag.id);

                // Category class for styling
                const categoryClass = `cat-${category.toLowerCase().replace(/\s+&?\s*/g, '-')}`;

                // Get freshness info if enabled (exclude Genre and Setting - not part of staleness mechanic)
                const showFreshnessForTag = showFreshness && tagFreshness && 
                  category !== 'Genre' && category !== 'Setting';
                const freshnessInfo = showFreshnessForTag
                  ? getTagFreshnessInfo(tag.id, tagFreshness)
                  : null;

                // Show swap icon on OTHER cards in single-select categories when one is already selected
                const showSwapIcon = isSingleSelect && !isSelected && selectedCount > 0;

                // Build bonus display for advanced mode (always show both)
                const comBonusStr = formatCompactBonus('CB', comBonusDelta) || 'CB-';
                const artBonusStr = formatCompactBonus('AB', artBonusDelta) || 'AB-';

                // Determine if we need advanced card size (either bonus or audience effects)
                const hasAdvancedContent = showBonusEffects || showAudienceEffects;

                return (
                  <button
                    key={tag.id}
                    className={`tag-browser-card ${categoryClass} ${selectedClass} ${outlineClass} ${showDeltas ? 'has-deltas' : ''} ${showDeltas && hasAdvancedContent ? 'has-advanced-deltas' : ''} ${showFreshnessForTag ? 'has-freshness' : ''} ${isTagDisabled ? 'tag-disabled' : ''} ${isBanned ? 'tag-banned' : ''} ${showSwapIcon ? 'can-swap' : ''}`.trim()}
                    onClick={() => !isTagDisabled && handleCardClick(tag.id, category)}
                    type="button"
                    disabled={isTagDisabled}
                  >
                    {showSwapIcon && <span className="swap-overlay">↻</span>}
                    {isBanned && <span className="banned-overlay">BANNED</span>}
                    <span className="tag-name">{tag.name}</span>
                    
                    {showDeltas && (
                      <span className="tag-content">
                        {freshnessInfo && (
                          <FreshnessMeter count={freshnessInfo.count} status={freshnessInfo.status} />
                        )}
                        <span className="tag-scores-primary">
                          <span className={`tag-delta ${getDeltaClass(artDelta)}`}>
                            A: {formatDelta(artDelta)}
                          </span>
                          <span className={`tag-delta ${getDeltaClass(comDelta)}`}>
                            C: {formatDelta(comDelta)}
                          </span>
                        </span>
                        
                        {showBonusEffects && (
                          <span className="tag-scores-breakdown">
                            <span className={`tag-delta-mini ${getBonusDeltaClass(synergyDelta)}`}>
                              SB: {formatCompactBonus('', synergyDelta) || '-'}
                            </span>
                            <span className="tag-delta-separator">|</span>
                            <span className={`tag-delta-mini ${getBonusDeltaClass(comBonusDelta)}`}>
                              {comBonusStr}
                            </span>
                            <span className={`tag-delta-mini ${getBonusDeltaClass(artBonusDelta)}`}>
                              {artBonusStr}
                            </span>
                          </span>
                        )}
                        
                        {showAudienceEffects && (
                          <span className="tag-audience">
                            <span className="tag-audience-row">
                              {['TM', 'YM', 'AM'].map(demoId => {
                                const change = audienceChanges[demoId];
                                const badgeClass = change === 'up' ? 'audience-up' : change === 'down' ? 'audience-down' : 'audience-neutral';
                                const symbol = change === 'up' ? '+' : change === 'down' ? '-' : '';
                                const label = demoId === 'TM' ? 'B' : demoId;
                                return (
                                  <span 
                                    key={demoId} 
                                    className={`audience-badge ${badgeClass}`}
                                  >
                                    {label}{symbol}
                                  </span>
                                );
                              })}
                            </span>
                            <span className="tag-audience-row">
                              {['TF', 'YF', 'AF'].map(demoId => {
                                const change = audienceChanges[demoId];
                                const badgeClass = change === 'up' ? 'audience-up' : change === 'down' ? 'audience-down' : 'audience-neutral';
                                const symbol = change === 'up' ? '+' : change === 'down' ? '-' : '';
                                const label = demoId === 'TF' ? 'G' : demoId;
                                return (
                                  <span 
                                    key={demoId} 
                                    className={`audience-badge ${badgeClass}`}
                                  >
                                    {label}{symbol}
                                  </span>
                                );
                              })}
                            </span>
                          </span>
                        )}
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
