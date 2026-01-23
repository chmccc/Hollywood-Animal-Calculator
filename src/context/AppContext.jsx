import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CATEGORIES, STARTER_WHITELIST } from '../data/gameData';

const AppContext = createContext(null);

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

  // Load localization - do this FIRST
  useEffect(() => {
    async function loadLocalization() {
      try {
        const res = await fetch(`/localization/${currentLanguage}.json`);
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
          fetch('/data/TagData.json'),
          fetch('/data/TagsAudienceWeights.json'),
          fetch('/data/TagCompatibilityData.json'),
          fetch('/data/GenrePairs.json')
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

  const getTagsByCategory = useCallback((category) => {
    return Object.values(tags)
      .filter(t => t.category === category)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tags]);

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
    getTagsByCategory
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
