/**
 * Parse a Hollywood Animal save.json file and extract game data.
 * 
 * @param {string} jsonString - The raw JSON string content of the save file
 * @returns {Object} - Extracted data including tagIds, moviesInProduction, maxTagSlots, studioName, and error
 */
export function parseSaveFile(jsonString) {
  try {
    // Strip BOM if present
    let content = jsonString;
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    const data = JSON.parse(content);
    
    // Validate structure
    if (!data.stateJson) {
      return { tagIds: [], error: 'Invalid save file: missing stateJson property' };
    }
    
    const stateJson = data.stateJson;
    const tagPool = stateJson.tagPool;
    
    if (!tagPool || !Array.isArray(tagPool)) {
      return { tagIds: [], error: 'Invalid save file: missing or invalid tagPool' };
    }
    
    // Extract tag IDs (Item1 from each entry)
    const tagIds = tagPool
      .map(item => item.Item1)
      .filter(id => id && typeof id === 'string');
    
    if (tagIds.length === 0) {
      return { tagIds: [], error: 'No tags found in save file' };
    }
    
    // Extract additional data
    const moviesInProduction = extractMoviesInProduction(stateJson);
    const maxTagSlots = extractMaxTagSlots(stateJson.openedPerks);
    const studioName = stateJson.studioName || null;
    
    return { 
      tagIds, 
      moviesInProduction,
      maxTagSlots,
      studioName,
      error: null 
    };
  } catch (e) {
    return { tagIds: [], error: `Failed to parse save file: ${e.message}` };
  }
}

/**
 * Extract movies currently in production (not yet released).
 * currentStage < 5 means the movie hasn't been released yet.
 * 
 * @param {Object} stateJson - The stateJson object from save file
 * @returns {Array} - Array of movies in production with their data
 */
function extractMoviesInProduction(stateJson) {
  if (!stateJson.movies || !Array.isArray(stateJson.movies)) return [];
  
  return stateJson.movies
    .filter(m => m.currentStage < 5)
    .map(m => ({
      id: m.id,
      name: m.name || m.Name || `Movie ${m.id}`,
      currentStage: m.currentStage,
      contentIds: m.contentIds || [],
      genreIdsAndFractions: m.genreIdsAndFractions || [],
      settingIds: m.settingIds || []
    }))
    .sort((a, b) => a.currentStage - b.currentStage); // Sort by phase (0=Script, 2=Preprod, 3=Prod)
}

/**
 * Extract max tag slots from opened perks.
 * Looks for TAGS_SLOTS_N perks and returns the highest N found.
 * 
 * @param {Array} openedPerks - Array of perk IDs from save file
 * @returns {number} - Maximum tag slots available (default 10 if no save, 5 if no research)
 */
function extractMaxTagSlots(openedPerks) {
  if (!openedPerks || !Array.isArray(openedPerks)) return 10; // Default when no save
  
  const slotPerks = openedPerks.filter(p => typeof p === 'string' && p.startsWith('TAGS_SLOTS_'));
  
  if (slotPerks.length === 0) return 5; // No research = base 5 slots
  
  const slots = slotPerks.map(p => {
    const parts = p.split('_');
    return parseInt(parts[parts.length - 1], 10);
  }).filter(n => !isNaN(n));
  
  return slots.length > 0 ? Math.max(...slots) : 5;
}
