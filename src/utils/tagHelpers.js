// Tag helper utilities

import { MULTI_SELECT_CATEGORIES } from '../data/gameData';

// Demographics IDs for audience calculation
const DEMO_IDS = ['YM', 'YF', 'TM', 'TF', 'AM', 'AF'];
const THRESHOLD_HIGH = 0.67;
const THRESHOLD_MODERATE = 0.33;

/**
 * Calculate audience scores from tag inputs
 * Returns normalized scores for each demographic (0-1 range)
 */
function calculateAudienceScores(tagInputs, allTags) {
  // Calculate tag affinity for each demographic
  const tagAffinity = { YM: 0, YF: 0, TM: 0, TF: 0, AM: 0, AF: 0 };
  
  tagInputs.forEach(item => {
    const tagData = allTags[item.id];
    if (!tagData || !tagData.weights) return;
    const multiplier = item.percent;
    for (const demo of DEMO_IDS) {
      if (tagData.weights[demo]) {
        tagAffinity[demo] += tagData.weights[demo] * multiplier;
      }
    }
  });

  // Normalize affinity values (lift minimum to 1.0)
  let minVal = Number.MAX_VALUE;
  for (const demo of DEMO_IDS) {
    if (tagAffinity[demo] < minVal) minVal = tagAffinity[demo];
  }
  if (minVal < 1.0) {
    const liftAmount = 1.0 - minVal;
    for (const demo of DEMO_IDS) {
      tagAffinity[demo] += liftAmount;
    }
  }

  // Calculate total and normalize
  let totalSum = 0;
  for (const demo of DEMO_IDS) totalSum += tagAffinity[demo];

  const RELEASE_MAGIC_NUMBER = 3.0;
  const scores = {};
  for (const demo of DEMO_IDS) {
    if (totalSum === 0) {
      scores[demo] = 0;
    } else {
      const normalized = (tagAffinity[demo] / totalSum) * RELEASE_MAGIC_NUMBER;
      scores[demo] = Math.min(1.0, Math.max(0, normalized));
    }
  }

  return scores;
}

/**
 * Get tier from score: 2 = high, 1 = moderate, 0 = none
 */
function getAudienceTier(score) {
  if (score >= THRESHOLD_HIGH) return 2;
  if (score > THRESHOLD_MODERATE) return 1;
  return 0;
}

/**
 * Compare baseline and hypothetical audience tiers
 * Returns object with 'up', 'down', or null for each demographic
 */
function compareAudienceTiers(baselineScores, hypotheticalScores) {
  const changes = {};
  for (const demo of DEMO_IDS) {
    const baseTier = getAudienceTier(baselineScores[demo] ?? 0);
    const hypTier = getAudienceTier(hypotheticalScores[demo] ?? 0);
    
    if (hypTier > baseTier) {
      changes[demo] = 'up';
    } else if (hypTier < baseTier) {
      changes[demo] = 'down';
    } else {
      changes[demo] = null;
    }
  }
  return changes;
}

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
 * Returns art/commercial score deltas plus synergy, bonus breakdowns, and audience tier changes.
 * 
 * @param {Array} currentTagInputs - Current selected tags in calculation format [{id, percent, category}]
 * @param {Object} allTags - All available tags from context
 * @param {Object} baseline - Baseline calculation result with displayArt, displayCom, totalScore, bonuses
 * @param {function} calculateSynergy - The synergy calculation function
 * @returns {Object} Map of tagId -> { artDelta, comDelta, synergyDelta, comBonusDelta, artBonusDelta, audienceChanges }
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
  
  // Calculate baseline audience scores once
  const baselineAudienceScores = calculateAudienceScores(currentTagInputs, allTags);
  
  for (const tagId of Object.keys(allTags)) {
    // Skip tags that are already selected
    if (selectedIds.has(tagId)) {
      deltas[tagId] = null;
      continue;
    }
    
    const tagData = allTags[tagId];
    if (!tagData) {
      deltas[tagId] = { artDelta: 0, comDelta: 0, synergyDelta: 0, comBonusDelta: 0, artBonusDelta: 0, audienceChanges: {} };
      continue;
    }
    
    // Create a hypothetical selection with this tag added/swapped
    // For single-select categories, we need to REPLACE the existing tag, not add to it
    const isSingleSelect = !MULTI_SELECT_CATEGORIES.includes(tagData.category);
    
    let hypotheticalTags;
    if (isSingleSelect) {
      // Filter out any existing tag in the same category, then add the new one
      hypotheticalTags = [
        ...currentTagInputs.filter(t => t.category !== tagData.category),
        { id: tagId, percent: 1.0, category: tagData.category }
      ];
    } else {
      // Multi-select: just add the tag
      hypotheticalTags = [
        ...currentTagInputs,
        { id: tagId, percent: 1.0, category: tagData.category }
      ];
    }
    
    // Calculate what the scores would be
    const result = calculateSynergy(hypotheticalTags);
    
    if (!result) {
      deltas[tagId] = { artDelta: 0, comDelta: 0, synergyDelta: 0, comBonusDelta: 0, artBonusDelta: 0, audienceChanges: {} };
      continue;
    }
    
    // Calculate deltas for final scores
    const artDelta = result.displayArt - baselineArt;
    const comDelta = result.displayCom - baselineCom;
    
    // Calculate deltas for breakdown values
    const synergyDelta = result.totalScore - baselineSynergy;
    const comBonusDelta = (result.bonuses?.com ?? 0) - baselineComBonus;
    const artBonusDelta = (result.bonuses?.art ?? 0) - baselineArtBonus;
    
    // Calculate audience tier changes
    const hypotheticalAudienceScores = calculateAudienceScores(hypotheticalTags, allTags);
    const audienceChanges = compareAudienceTiers(baselineAudienceScores, hypotheticalAudienceScores);
    
    deltas[tagId] = { artDelta, comDelta, synergyDelta, comBonusDelta, artBonusDelta, audienceChanges };
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
