/**
 * Parse a Hollywood Animal save.json file and extract owned tag IDs from tagPool.
 * 
 * @param {string} jsonString - The raw JSON string content of the save file
 * @returns {{ tagIds: string[], error: string | null }} - Array of tag IDs or error message
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
    
    const tagPool = data.stateJson.tagPool;
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
    
    return { tagIds, error: null };
  } catch (e) {
    return { tagIds: [], error: `Failed to parse save file: ${e.message}` };
  }
}
