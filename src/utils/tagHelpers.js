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
