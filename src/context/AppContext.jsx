import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CATEGORIES, STARTER_WHITELIST } from '../data/gameData';
import { parseSaveFile } from '../utils/saveParser';
import { calculateFreshnessFromSaveData } from '../utils/freshness';
import { useSaveWatcher, isFileSystemAccessSupported } from '../hooks/useSaveWatcher';

const AppContext = createContext(null);

// localStorage keys for save data persistence
const STORAGE_KEY_OWNED_TAGS = 'ownedTagIds';
const STORAGE_KEY_SAVE_SOURCE = 'saveSourceName';
const STORAGE_KEY_MOVIES_IN_PROD = 'moviesInProduction';
const STORAGE_KEY_MAX_TAG_SLOTS = 'maxTagSlots';
const STORAGE_KEY_STUDIO_NAME = 'studioName';
const STORAGE_KEY_OWNED_THEATRES = 'ownedTheatres';
const STORAGE_KEY_CODEX_BANNED = 'codexBannedTags';
const STORAGE_KEY_FRESHNESS_DATA = 'freshnessData';
const STORAGE_KEY_INCLUDE_UNRELEASED = 'freshnessIncludeUnreleased';
const STORAGE_KEY_FILE_TIMESTAMP = 'saveFileTimestamp';
const STORAGE_KEY_SHOW_BONUS_EFFECTS = 'showBonusEffects';
const STORAGE_KEY_SHOW_AUDIENCE_EFFECTS = 'showAudienceEffects';

// Helper function to beautify tag names
function beautifyTagName(rawId, localizationMap = {}) {
  // First check localization map
  if (localizationMap[rawId]) {
    return localizationMap[rawId];
  }
  
  // Fallback: clean up the raw ID
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

function parseWeights(weightObj) {
  const clean = {};
  for (let key in weightObj) {
    clean[key] = parseFloat(weightObj[key]);
  }
  return clean;
}

export function AppProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [localizationMap, setLocalizationMap] = useState({});
  const [tags, setTags] = useState({});
  const [compatibility, setCompatibility] = useState({});
  const [genrePairs, setGenrePairs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const rawTagsRef = useRef({}); // Store raw tag data for re-processing
  const localizationAppliedRef = useRef(false); // Track if localization has been applied to current tags

  // Save file state - owned tags from uploaded save
  const [ownedTagIds, setOwnedTagIds] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OWNED_TAGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch (e) {
      console.error('Failed to load owned tags from localStorage:', e);
    }
    return null;
  });
  
  const [saveSourceName, setSaveSourceName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SAVE_SOURCE) || null;
  });

  // Additional save data state
  const [moviesInProduction, setMoviesInProduction] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVIES_IN_PROD);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load movies in production from localStorage:', e);
      return [];
    }
  });

  const [maxTagSlots, setMaxTagSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MAX_TAG_SLOTS);
      return saved ? parseInt(saved, 10) : 10; // Default 10 if no save
    } catch (e) {
      return 10;
    }
  });

  const [studioName, setStudioName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_STUDIO_NAME) || null;
  });

  const [ownedTheatres, setOwnedTheatres] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OWNED_THEATRES);
      return saved ? parseInt(saved, 10) : null; // null means no save loaded
    } catch (e) {
      return null;
    }
  });

  const [codexBannedTags, setCodexBannedTags] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CODEX_BANNED);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Freshness data from save file
  const [freshnessData, setFreshnessData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRESHNESS_DATA);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Setting: include unreleased movies in freshness calculation
  const [freshnessIncludeUnreleased, setFreshnessIncludeUnreleased] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCLUDE_UNRELEASED);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  // Setting: show bonus effects breakdown (SB/CB/AB deltas)
  const [showBonusEffects, setShowBonusEffects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOW_BONUS_EFFECTS);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  // Setting: show target audience effects (demographic tier changes)
  const [showAudienceEffects, setShowAudienceEffects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHOW_AUDIENCE_EFFECTS);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  // File modification timestamp (real-world time when save was written)
  const [saveFileTimestamp, setSaveFileTimestamp] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILE_TIMESTAMP);
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      return null;
    }
  });

  // Load localization - do this FIRST
  useEffect(() => {
    async function loadLocalization() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}localization/${currentLanguage}.json`);
        if (!res.ok) throw new Error(`Could not load ${currentLanguage}.json`);
        
        const locData = await res.json();
        const newMap = {};
        
        if (locData.IdMap && locData.locStrings) {
          for (const [tagId, index] of Object.entries(locData.IdMap)) {
            if (locData.locStrings[index]) {
              newMap[tagId] = locData.locStrings[index];
            }
          }
        }
        
        setLocalizationMap(newMap);
      } catch (e) {
        console.error("Localization Error:", e);
      }
    }

    loadLocalization();
  }, [currentLanguage]);

  // Load external JSON data on mount
  useEffect(() => {
    async function loadExternalData() {
      try {
        const [tagRes, weightRes, compRes, genreRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/TagData.json`),
          fetch(`${import.meta.env.BASE_URL}data/TagsAudienceWeights.json`),
          fetch(`${import.meta.env.BASE_URL}data/TagCompatibilityData.json`),
          fetch(`${import.meta.env.BASE_URL}data/GenrePairs.json`)
        ]);

        if (!tagRes.ok || !weightRes.ok) {
          throw new Error('Failed to load tag data');
        }

        const tagDataRaw = await tagRes.json();
        const weightDataRaw = await weightRes.json();
        const compData = compRes.ok ? await compRes.json() : {};
        const genreData = genreRes.ok ? await genreRes.json() : {};

        setCompatibility(compData);
        setGenrePairs(genreData);

        // Process tags - store raw data for later
        const processedTags = {};
        for (const [tagId, data] of Object.entries(tagDataRaw)) {
          if (!weightDataRaw[tagId]) continue;

          let category = "Unknown";
          if (data.type === 0) category = "Genre";
          else if (data.type === 1) category = "Setting";
          else if (data.CategoryID) {
            switch (data.CategoryID) {
              case "Protagonist": category = "Protagonist"; break;
              case "Antagonist": category = "Antagonist"; break;
              case "SupportingCharacter": category = "Supporting Character"; break;
              case "Theme": category = "Theme & Event"; break;
              case "Finale": category = "Finale"; break;
              default: category = data.CategoryID;
            }
          }
          if (tagId.startsWith("EVENTS_")) category = "Theme & Event";

          processedTags[tagId] = {
            id: tagId,
            name: beautifyTagName(tagId), // Beautify immediately
            category: category,
            art: parseFloat(data.artValue || 0),
            com: parseFloat(data.commercialValue || 0),
            weights: parseWeights(weightDataRaw[tagId].weights)
          };
        }

        rawTagsRef.current = processedTags;
        localizationAppliedRef.current = false; // Reset when tags are loaded
        setTags(processedTags);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to load external data:", e);
        setIsLoading(false);
      }
    }

    loadExternalData();
  }, []);

  // Apply localization to tags when both are available
  useEffect(() => {
    const hasLocalization = Object.keys(localizationMap).length > 0;
    const hasTags = Object.keys(tags).length > 0;
    
    if (hasLocalization && hasTags && !localizationAppliedRef.current) {
      localizationAppliedRef.current = true;
      setTags(prevTags => {
        const updated = {};
        for (const tagId in prevTags) {
          updated[tagId] = {
            ...prevTags[tagId],
            name: beautifyTagName(tagId, localizationMap)
          };
        }
        return updated;
      });
    }
    
    // Reset the flag when localizationMap changes (e.g., language switch)
    // This allows re-applying with new language
  }, [localizationMap, tags]);

  // Reset localization applied flag when language changes
  useEffect(() => {
    localizationAppliedRef.current = false;
  }, [currentLanguage]);

  const changeLanguage = useCallback((lang) => {
    setCurrentLanguage(lang);
  }, []);

  // Load save data from JSON string
  // fileTimestamp is the file's lastModified time from the filesystem (optional)
  const loadSaveData = useCallback((jsonString, sourceName = 'save.json', fileTimestamp = null) => {
    const { 
      tagIds, 
      moviesInProduction: movies, 
      maxTagSlots: slots, 
      studioName: studio,
      ownedTheatres: theatres,
      codexBannedTags: bannedTags,
      freshnessData: freshness,
      error 
    } = parseSaveFile(jsonString);
    
    if (error) {
      return { success: false, error };
    }
    
    const tagSet = new Set(tagIds);
    setOwnedTagIds(tagSet);
    setSaveSourceName(sourceName);
    setMoviesInProduction(movies || []);
    setMaxTagSlots(slots || 10);
    setStudioName(studio || null);
    setOwnedTheatres(theatres ?? 0);
    setCodexBannedTags(bannedTags || new Set());
    setFreshnessData(freshness || null);
    setSaveFileTimestamp(fileTimestamp);
    
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY_OWNED_TAGS, JSON.stringify(tagIds));
      localStorage.setItem(STORAGE_KEY_SAVE_SOURCE, sourceName);
      localStorage.setItem(STORAGE_KEY_MOVIES_IN_PROD, JSON.stringify(movies || []));
      localStorage.setItem(STORAGE_KEY_MAX_TAG_SLOTS, String(slots || 10));
      localStorage.setItem(STORAGE_KEY_OWNED_THEATRES, String(theatres ?? 0));
      localStorage.setItem(STORAGE_KEY_CODEX_BANNED, JSON.stringify([...(bannedTags || [])]));
      localStorage.setItem(STORAGE_KEY_FRESHNESS_DATA, JSON.stringify(freshness || null));
      if (fileTimestamp) {
        localStorage.setItem(STORAGE_KEY_FILE_TIMESTAMP, String(fileTimestamp));
      } else {
        localStorage.removeItem(STORAGE_KEY_FILE_TIMESTAMP);
      }
      if (studio) {
        localStorage.setItem(STORAGE_KEY_STUDIO_NAME, studio);
      } else {
        localStorage.removeItem(STORAGE_KEY_STUDIO_NAME);
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    return { success: true, count: tagIds.length, moviesInProduction: movies?.length || 0 };
  }, []);

  // Clear save data
  const clearSaveData = useCallback(() => {
    setOwnedTagIds(null);
    setSaveSourceName(null);
    setMoviesInProduction([]);
    setMaxTagSlots(10); // Reset to default
    setStudioName(null);
    setOwnedTheatres(null); // Reset to null (no save loaded)
    setCodexBannedTags(new Set());
    setFreshnessData(null);
    setSaveFileTimestamp(null);
    
    try {
      localStorage.removeItem(STORAGE_KEY_OWNED_TAGS);
      localStorage.removeItem(STORAGE_KEY_SAVE_SOURCE);
      localStorage.removeItem(STORAGE_KEY_MOVIES_IN_PROD);
      localStorage.removeItem(STORAGE_KEY_MAX_TAG_SLOTS);
      localStorage.removeItem(STORAGE_KEY_STUDIO_NAME);
      localStorage.removeItem(STORAGE_KEY_OWNED_THEATRES);
      localStorage.removeItem(STORAGE_KEY_CODEX_BANNED);
      localStorage.removeItem(STORAGE_KEY_FRESHNESS_DATA);
      localStorage.removeItem(STORAGE_KEY_FILE_TIMESTAMP);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }, []);

  // Toggle include unreleased setting
  const toggleFreshnessIncludeUnreleased = useCallback(() => {
    setFreshnessIncludeUnreleased(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_INCLUDE_UNRELEASED, String(newVal));
      } catch (e) {
        console.error('Failed to save setting:', e);
      }
      return newVal;
    });
  }, []);

  // Toggle bonus effects display (SB/CB/AB)
  const toggleBonusEffects = useCallback(() => {
    setShowBonusEffects(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SHOW_BONUS_EFFECTS, String(newVal));
      } catch (e) {
        console.error('Failed to save setting:', e);
      }
      return newVal;
    });
  }, []);

  // Toggle audience effects display (demographic badges)
  const toggleAudienceEffects = useCallback(() => {
    setShowAudienceEffects(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SHOW_AUDIENCE_EFFECTS, String(newVal));
      } catch (e) {
        console.error('Failed to save setting:', e);
      }
      return newVal;
    });
  }, []);

  // Computed: tag freshness map (recalculates when data or setting changes)
  const tagFreshness = useMemo(() => {
    if (!freshnessData) return null;
    const { tagFreshness: freshMap } = calculateFreshnessFromSaveData(
      freshnessData, 
      freshnessIncludeUnreleased
    );
    return freshMap;
  }, [freshnessData, freshnessIncludeUnreleased]);

  // Freshness stats for display
  const freshnessStats = useMemo(() => {
    if (!freshnessData) return null;
    const { stats } = calculateFreshnessFromSaveData(
      freshnessData,
      freshnessIncludeUnreleased
    );
    return stats;
  }, [freshnessData, freshnessIncludeUnreleased]);

  // Get tags by category, filtered by owned tags if a save is loaded
  const getTagsByCategory = useCallback((category) => {
    return Object.values(tags)
      .filter(t => t.category === category)
      .filter(t => !ownedTagIds || ownedTagIds.has(t.id)) // Filter by owned if save loaded
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tags, ownedTagIds]);

  // Save directory watcher
  const saveWatcher = useSaveWatcher({
    onNewSave: useCallback((jsonString, fileName, fileTimestamp) => {
      const result = loadSaveData(jsonString, fileName, fileTimestamp);
      if (!result.success) {
        console.error('Auto-load failed:', result.error);
      }
    }, [loadSaveData]),
    pollInterval: 3000 // Check every 3 seconds
  });

  const value = {
    currentLanguage,
    changeLanguage,
    localizationMap,
    tags,
    compatibility,
    genrePairs,
    categories: CATEGORIES,
    starterWhitelist: STARTER_WHITELIST,
    isLoading,
    getTagsByCategory,
    // Save file state
    ownedTagIds,
    saveSourceName,
    saveFileTimestamp,
    loadSaveData,
    clearSaveData,
    // Additional save data
    moviesInProduction,
    maxTagSlots,
    studioName,
    ownedTheatres,
    codexBannedTags,
    // Freshness data
    tagFreshness,
    freshnessStats,
    freshnessIncludeUnreleased,
    toggleFreshnessIncludeUnreleased,
    // Advanced display settings
    showBonusEffects,
    toggleBonusEffects,
    showAudienceEffects,
    toggleAudienceEffects,
    // Save directory watcher
    saveWatcher,
    isFileSystemAccessSupported: isFileSystemAccessSupported(),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
