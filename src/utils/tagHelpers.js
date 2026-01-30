// Tag helper utilities

export function beautifyTagName(rawId, localizationMap = {}) {
  if (localizationMap[rawId]) {
    return localizationMap[rawId];
  }
  let name = rawId;
  const prefixes = ["PROTAGONIST_", "ANTAGONIST_", "SUPPORTINGCHARACTER_", "THEME_", "EVENTS_", "FINALE_", "EVENT_"];
  prefixes.forEach(p => {
    if (name.startsWith(p)) name = name.substring(p.length);
  });
  return name.replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildSearchIndex(tags) {
  return Object.values(tags).map(tag => ({
    id: tag.id,
    name: tag.name,
    category: tag.category
  }));
}

export function searchTags(searchIndex, query) {
  const lowerQuery = query.toLowerCase();
  return searchIndex.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate score deltas for all tags by simulating what would happen if each tag were added.
 * Returns art/commercial score deltas plus synergy and bonus breakdowns for each unselected tag.
 * 
 * @param {Array} currentTagInputs - Current selected tags in calculation format [{id, percent, category}]
 * @param {Object} allTags - All available tags from context
 * @param {Object} baseline - Baseline calculation result with displayArt, displayCom, totalScore, bonuses
 * @param {function} calculateSynergy - The synergy calculation function
 * @returns {Object} Map of tagId -> { artDelta, comDelta, synergyDelta, comBonusDelta, artBonusDelta }
 */
export function calculateScoreDeltas(
  currentTagInputs,
  allTags,
  baseline,
  calculateSynergy
) {
  const deltas = {};
  const selectedIds = new Set(currentTagInputs.map(t => t.id));
  
  // Extract baseline values
  const baselineArt = baseline?.displayArt ?? 0;
  const baselineCom = baseline?.displayCom ?? 0;
  const baselineSynergy = baseline?.totalScore ?? 0;
  const baselineComBonus = baseline?.bonuses?.com ?? 0;
  const baselineArtBonus = baseline?.bonuses?.art ?? 0;
  
  for (const tagId of Object.keys(allTags)) {
    // Skip tags that are already selected
    if (selectedIds.has(tagId)) {
      deltas[tagId] = null;
      continue;
    }
    
    const tagData = allTags[tagId];
    if (!tagData) {
      deltas[tagId] = { artDelta: 0, comDelta: 0, synergyDelta: 0, comBonusDelta: 0, artBonusDelta: 0 };
      continue;
    }
    
    // Create a hypothetical selection with this tag added
    const hypotheticalTags = [
      ...currentTagInputs,
      { id: tagId, percent: 1.0, category: tagData.category }
    ];
    
    // Calculate what the scores would be
    const result = calculateSynergy(hypotheticalTags);
    
    if (!result) {
      deltas[tagId] = { artDelta: 0, comDelta: 0, synergyDelta: 0, comBonusDelta: 0, artBonusDelta: 0 };
      continue;
    }
    
    // Calculate deltas for final scores
    const artDelta = result.displayArt - baselineArt;
    const comDelta = result.displayCom - baselineCom;
    
    // Calculate deltas for breakdown values
    const synergyDelta = result.totalScore - baselineSynergy;
    const comBonusDelta = (result.bonuses?.com ?? 0) - baselineComBonus;
    const artBonusDelta = (result.bonuses?.art ?? 0) - baselineArtBonus;
    
    deltas[tagId] = { artDelta, comDelta, synergyDelta, comBonusDelta, artBonusDelta };
  }
  
  return deltas;
}

// Collect tag inputs from selector state
export function collectTagInputs(selectedTags, genrePercents = {}) {
  const tagInputs = [];
  
  // Handle genres with percentages
  const genres = selectedTags.filter(t => t.category === "Genre");
  let totalGenreInput = 0;
  const genreData = [];
  
  genres.forEach(tag => {
    const percent = genrePercents[tag.id] ?? 100;
    totalGenreInput += percent;
    genreData.push({ id: tag.id, inputVal: percent });
  });
  
  if (totalGenreInput === 0 && genreData.length > 0) totalGenreInput = 1;
  
  genreData.forEach(g => {
    tagInputs.push({
      id: g.id,
      percent: g.inputVal / totalGenreInput,
      category: "Genre"
    });
  });
  
  // Handle all other categories
  selectedTags.forEach(tag => {
    if (tag.category !== "Genre") {
      tagInputs.push({
        id: tag.id,
        percent: 1.0,
        category: tag.category
      });
    }
  });
  
  return tagInputs;
}
