/**
 * Freshness Calculation Utility
 * 
 * Freshness in Hollywood Animal is based on how many movies have been released
 * with a given tag in the last 500 days. Lower is fresher.
 * 
 * Scale:
 *   0-3 movies: Fresh (green)  - Won't reduce viewers' interest
 *   4-5 movies: Stale (orange) - Starting to feel overused
 *   6+  movies: Rotten (red)   - Audience fatigue, reduced interest
 */

export const FRESHNESS_WINDOW_DAYS = 500;

// Freshness thresholds
export const FRESHNESS_THRESHOLDS = {
  FRESH_MAX: 3,      // 0-3 is fresh
  STALE_MAX: 5,      // 4-5 is stale
  // 6+ is rotten
};

// Freshness status enum
export const FreshnessStatus = {
  FRESH: 'fresh',
  STALE: 'stale', 
  ROTTEN: 'rotten',
};

/**
 * Determines the freshness status based on movie count
 * @param {number} movieCount - Number of movies using this tag in the window
 * @returns {string} FreshnessStatus value
 */
export function getFreshnessStatus(movieCount) {
  if (movieCount <= FRESHNESS_THRESHOLDS.FRESH_MAX) {
    return FreshnessStatus.FRESH;
  }
  if (movieCount <= FRESHNESS_THRESHOLDS.STALE_MAX) {
    return FreshnessStatus.STALE;
  }
  return FreshnessStatus.ROTTEN;
}

/**
 * Calculates freshness scores for all tags from parsed save data.
 * 
 * @param {Object} freshnessData - Data from saveParser.extractFreshnessData()
 * @param {boolean} includeUnreleased - Whether to include unreleased movies in count
 * @returns {Object} { tagFreshness: Map<tagId, count>, stats }
 */
export function calculateFreshnessFromSaveData(freshnessData, includeUnreleased = false) {
  if (!freshnessData) {
    return { tagFreshness: new Map(), stats: null };
  }
  
  const { currentDate, releasedMovies, unreleasedMovies } = freshnessData;
  const currentDateObj = new Date(currentDate);
  const cutoffDate = new Date(currentDateObj);
  cutoffDate.setDate(cutoffDate.getDate() - FRESHNESS_WINDOW_DAYS);
  
  const tagCounts = new Map();
  
  // Count from released movies in the 500-day window
  const recentReleasedMovies = releasedMovies.filter(movie => {
    const releaseDate = new Date(movie.releaseDate);
    return releaseDate >= cutoffDate && releaseDate <= currentDateObj;
  });
  
  recentReleasedMovies.forEach(movie => {
    if (!movie.contentIds) return;
    movie.contentIds.forEach(tagId => {
      const current = tagCounts.get(tagId) || 0;
      tagCounts.set(tagId, current + 1);
    });
  });
  
  // Optionally include unreleased movies (all of them count, since they're upcoming)
  if (includeUnreleased) {
    unreleasedMovies.forEach(movie => {
      if (!movie.contentIds) return;
      movie.contentIds.forEach(tagId => {
        const current = tagCounts.get(tagId) || 0;
        tagCounts.set(tagId, current + 1);
      });
    });
  }
  
  return {
    tagFreshness: tagCounts,
    stats: {
      currentDate: currentDateObj,
      cutoffDate,
      releasedInWindow: recentReleasedMovies.length,
      totalReleased: releasedMovies.length,
      unreleased: unreleasedMovies.length,
      includeUnreleased,
    },
  };
}

/**
 * Gets the freshness score and status for a tag
 * @param {string} tagId - The tag ID
 * @param {Map<string, number>} tagFreshness - Map of tagId to count
 * @returns {Object} { count, status }
 */
export function getTagFreshnessInfo(tagId, tagFreshness) {
  if (!tagFreshness) {
    return { count: 0, status: FreshnessStatus.FRESH };
  }
  const count = tagFreshness.get(tagId) || 0;
  const status = getFreshnessStatus(count);
  
  return { count, status };
}

/**
 * Get CSS color class for freshness status
 * @param {string} status - FreshnessStatus value
 * @returns {string} CSS class name
 */
export function getFreshnessColorClass(status) {
  switch (status) {
    case FreshnessStatus.FRESH:
      return 'freshness-fresh';
    case FreshnessStatus.STALE:
      return 'freshness-stale';
    case FreshnessStatus.ROTTEN:
      return 'freshness-rotten';
    default:
      return 'freshness-fresh';
  }
}

export default {
  FRESHNESS_WINDOW_DAYS,
  FRESHNESS_THRESHOLDS,
  FreshnessStatus,
  getFreshnessStatus,
  calculateFreshnessFromSaveData,
  getTagFreshnessInfo,
  getFreshnessColorClass,
};
