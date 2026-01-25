import { useState, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMatrixScore, calculateTotalBonuses, getScoringElementCount } from '../utils/calculations';

export function useScriptGenerator() {
  const { tags, compatibility, genrePairs, starterWhitelist, ownedTagIds, moviesInProduction, maxTagSlots } = useApp();
  const [generatedScripts, setGeneratedScripts] = useState([]);
  const [pinnedScripts, setPinnedScripts] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem('pinnedScripts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage when pinned scripts change
  const savePinnedScripts = useCallback((scripts) => {
    setPinnedScripts(scripts);
    localStorage.setItem('pinnedScripts', JSON.stringify(scripts));
  }, []);

  // Convert a movie from save data to a pinned script format
  const convertMovieToScript = useCallback((movie) => {
    // Build tags array from movie data
    const scriptTags = [];
    
    // Add genres with their fractions
    if (movie.genreIdsAndFractions && movie.genreIdsAndFractions.length > 0) {
      movie.genreIdsAndFractions.forEach(g => {
        scriptTags.push({
          id: g.Item1,
          percent: parseFloat(g.Item2) || 1.0,
          category: 'Genre'
        });
      });
    }
    
    // Add settings
    if (movie.settingIds && movie.settingIds.length > 0) {
      movie.settingIds.forEach(id => {
        scriptTags.push({
          id: id,
          percent: 1.0,
          category: 'Setting'
        });
      });
    }
    
    // Add content tags (protagonists, antagonists, themes, etc.)
    if (movie.contentIds && movie.contentIds.length > 0) {
      movie.contentIds.forEach(id => {
        // Determine category from tag ID
        let category = 'Theme & Event';
        if (id.startsWith('PROTAGONIST_')) category = 'Protagonist';
        else if (id.startsWith('ANTAGONIST_')) category = 'Antagonist';
        else if (id.startsWith('SUPPORTINGCHARACTER_')) category = 'Supporting Character';
        else if (id.startsWith('FINALE_')) category = 'Finale';
        else if (id.startsWith('THEME_') || id.startsWith('EVENTS_') || id.startsWith('EVENT_')) category = 'Theme & Event';
        
        scriptTags.push({
          id: id,
          percent: 1.0,
          category: category
        });
      });
    }
    
    // Get production phase name
    const phaseNames = {
      0: 'Script',
      1: 'Pre-prod',
      2: 'Pre-prod',
      3: 'Production',
      4: 'Post-prod'
    };
    const phaseName = phaseNames[movie.currentStage] || `Stage ${movie.currentStage}`;
    
    return {
      tags: scriptTags,
      stats: {
        avgComp: 0,
        synergySum: 0,
        maxScriptQuality: 0,
        movieScore: '0.0'
      },
      uniqueId: `save-movie-${movie.id}`,
      name: (movie.name || `Movie ${movie.id}`).toUpperCase(),
      fromSave: true,
      movieId: movie.id,
      currentStage: movie.currentStage,
      phaseName: phaseName
    };
  }, []);

  // Auto-pin movies from save when moviesInProduction changes, or clear when save is unloaded
  useEffect(() => {
    const hasSavePins = pinnedScripts.some(s => s.fromSave);
    
    // If save is unloaded (no movies in production), clear any existing save pins
    if (!moviesInProduction || moviesInProduction.length === 0) {
      if (hasSavePins) {
        const userPins = pinnedScripts.filter(s => !s.fromSave);
        savePinnedScripts(userPins);
      }
      return;
    }
    
    // Get current pinned script IDs
    const currentSaveMovieIds = new Set(
      pinnedScripts
        .filter(s => s.fromSave)
        .map(s => s.movieId)
    );
    
    // Check if we need to add any new movies
    const newMovies = moviesInProduction.filter(m => !currentSaveMovieIds.has(m.id));
    
    if (newMovies.length > 0) {
      // Convert new movies to scripts
      const newScripts = newMovies.map(m => convertMovieToScript(m));
      
      // Merge with existing pinned scripts (user pins stay, save pins get updated)
      const userPins = pinnedScripts.filter(s => !s.fromSave);
      const existingSaveIds = new Set(moviesInProduction.map(m => m.id));
      const validExistingSavePins = pinnedScripts
        .filter(s => s.fromSave && existingSaveIds.has(s.movieId));
      
      // Combine: user pins first, then save pins sorted by stage
      const allSavePins = [...validExistingSavePins, ...newScripts]
        .sort((a, b) => a.currentStage - b.currentStage);
      
      savePinnedScripts([...userPins, ...allSavePins]);
    }
  }, [moviesInProduction, convertMovieToScript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sorted pinned scripts: user-created first, then save movies ordered by production phase
  const sortedPinnedScripts = useMemo(() => {
    const userPins = pinnedScripts.filter(s => !s.fromSave);
    const savePins = pinnedScripts
      .filter(s => s.fromSave)
      .sort((a, b) => (a.currentStage || 0) - (b.currentStage || 0));
    return [...userPins, ...savePins];
  }, [pinnedScripts]);

  const getCompatibleGenres = useCallback((sourceId, excludedIds) => {
    let valid = [];
    if (genrePairs[sourceId]) {
      valid.push(...Object.keys(genrePairs[sourceId]));
    }
    for (const gKey in genrePairs) {
      if (genrePairs[gKey] && genrePairs[gKey][sourceId]) {
        valid.push(gKey);
      }
    }
    const unique = new Set(valid);
    return [...unique]
      .filter(id => !excludedIds.has(id))
      .filter(id => !ownedTagIds || ownedTagIds.has(id)); // Filter by owned tags if save loaded
  }, [genrePairs, ownedTagIds]);

  const getRandomTagByCategory = useCallback((category, currentTags, excludedIds) => {
    const existingIds = new Set(currentTags.map(t => t.id));
    const allTags = Object.values(tags)
      .filter(t => t.category === category)
      .filter(t => !ownedTagIds || ownedTagIds.has(t.id)); // Filter by owned tags if save loaded
    const available = allTags.filter(t => !existingIds.has(t.id) && !excludedIds.has(t.id));
    
    if (available.length === 0) return null;
    const picked = available[Math.floor(Math.random() * available.length)];
    
    return {
      id: picked.id,
      percent: 1.0,
      category: category
    };
  }, [tags, ownedTagIds]);

  const runGenerationAlgorithm = useCallback((targetComp, targetCount, fixedTags, excludedTags) => {
    const excludedIds = new Set(excludedTags.map(t => t.id));
    
    // 1. Setup Initial Candidate
    let currentTags = [...fixedTags];
    const categoriesPresent = new Set(currentTags.map(t => t.category));
    
    // A. Handle Genres
    const fixedGenres = currentTags.filter(t => t.category === "Genre");
    if (fixedGenres.length === 0) {
      const genre1 = getRandomTagByCategory("Genre", currentTags, excludedIds);
      if (genre1) {
        let partnerId = null;
        if (Math.random() < 0.3) {
          const partners = getCompatibleGenres(genre1.id, excludedIds);
          if (partners.length > 0) {
            partnerId = partners[Math.floor(Math.random() * partners.length)];
          }
        }
        if (partnerId) {
          genre1.percent = 0.5;
          currentTags.push(genre1);
          currentTags.push({ id: partnerId, percent: 0.5, category: "Genre" });
        } else {
          genre1.percent = 1.0;
          currentTags.push(genre1);
        }
      }
    }

    // B. Handle Mandatory Setting
    if (!categoriesPresent.has("Setting")) {
      const randomSetting = getRandomTagByCategory("Setting", currentTags, excludedIds);
      if (randomSetting) {
        currentTags.push(randomSetting);
        categoriesPresent.add("Setting");
      }
    }

    // C. Fill Mandatory Scoring Categories
    const scoringMandatory = ["Protagonist", "Antagonist", "Finale"];
    scoringMandatory.forEach(cat => {
      if (!categoriesPresent.has(cat) && getScoringElementCount(currentTags) < targetCount) {
        const randomTag = getRandomTagByCategory(cat, currentTags, excludedIds);
        if (randomTag) {
          currentTags.push(randomTag);
          categoriesPresent.add(cat);
        }
      }
    });

    // D. Fill remaining slots
    const fillerCats = ["Supporting Character", "Theme & Event"];
    while (getScoringElementCount(currentTags) < targetCount) {
      const randCat = fillerCats[Math.floor(Math.random() * fillerCats.length)];
      const randomTag = getRandomTagByCategory(randCat, currentTags, excludedIds);
      if (randomTag) currentTags.push(randomTag);
      else break;
    }
    
    // 2. Optimization Loop
    let bestSet = [...currentTags];
    let bestStats = calculateMatrixScore(bestSet, tags, compatibility);
    
    const iterations = 200;
    for (let i = 0; i < iterations; i++) {
      let candidate = [...bestSet];
      const fixedIds = new Set(fixedTags.map(t => t.id));
      const mutableIndices = candidate.map((t, idx) => ({ t, idx }))
        .filter(item => !fixedIds.has(item.t.id) && item.t.category !== 'Genre')
        .map(item => item.idx);
      if (mutableIndices.length === 0) break;
      
      const swapIdx = mutableIndices[Math.floor(Math.random() * mutableIndices.length)];
      const tagToSwap = candidate[swapIdx];
      const newTag = getRandomTagByCategory(tagToSwap.category, candidate, excludedIds);
      
      if (newTag) {
        candidate[swapIdx] = newTag;
        const newStats = calculateMatrixScore(candidate, tags, compatibility);
        if (newStats.rawAverage > bestStats.rawAverage) {
          bestSet = candidate;
          bestStats = newStats;
        }
      }
    }
    
    // 3. Calculate Final Stats
    const ngCount = getScoringElementCount(bestSet);
    let tagCap = 6;
    let maxScriptQual = 5;
    
    if (ngCount >= 9) { tagCap = 9; maxScriptQual = 8; }
    else if (ngCount >= 7) { tagCap = 8; maxScriptQual = 7; }
    else if (ngCount >= 5) { tagCap = 7; maxScriptQual = 6; }
    else { tagCap = 6; maxScriptQual = 5; }
    
    const bonuses = calculateTotalBonuses(bestSet, tags, genrePairs);
    const MAX_GAME_SCORE = 9.9;
    const rawCom = (bestStats.totalScore + bonuses.com) * MAX_GAME_SCORE;
    const rawArt = (bestStats.totalScore + bonuses.art) * MAX_GAME_SCORE;
    const maxPotential = Math.max(0, Math.max(rawCom, rawArt));
    
    const finalMovieScore = Math.min(tagCap, maxPotential);
    const displayCom = Math.min(tagCap, Math.max(0, rawCom));
    const displayArt = Math.min(tagCap, Math.max(0, rawArt));

    return {
      tags: bestSet,
      stats: {
        avgComp: bestStats.rawAverage,
        synergySum: bestStats.totalScore,
        maxScriptQuality: maxScriptQual,
        movieScore: finalMovieScore.toFixed(1),
        comScore: displayCom,
        artScore: displayArt
      },
      uniqueId: Date.now() + Math.random().toString()
    };
  }, [tags, compatibility, genrePairs, getRandomTagByCategory, getCompatibleGenres]);

  const generateScripts = useCallback((targetComp, targetScoreInput, fixedTags, excludedTags) => {
    // Map Movie Score to Required Scoring Elements
    let targetCount = 4;
    if (targetScoreInput === 6) targetCount = 5;
    else if (targetScoreInput === 7) targetCount = 7;
    else if (targetScoreInput === 8) targetCount = 8;
    else if (targetScoreInput >= 9) targetCount = 9;
    
    // Cap at research limit (maxTagSlots from save)
    targetCount = Math.min(targetCount, maxTagSlots);

    // Validate
    const scoringFixed = fixedTags.filter(t => t.category !== "Genre" && t.category !== "Setting");
    
    if (scoringFixed.length > targetCount) {
      return { error: `You have locked ${scoringFixed.length} scoring elements, but the target Movie Score only allows for ~${targetCount}. Increase the target Movie Score or remove locked elements.` };
    }

    const generatedBatch = [];
    
    // Generate 5 Output Slots
    for (let i = 0; i < 5; i++) {
      let bestCandidate = null;
      const MAX_ATTEMPTS = 50;
      
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = runGenerationAlgorithm(targetComp, targetCount, fixedTags, excludedTags);
        
        if (!bestCandidate || candidate.stats.avgComp > bestCandidate.stats.avgComp) {
          bestCandidate = candidate;
        }
        
        if (bestCandidate.stats.avgComp >= targetComp && parseFloat(bestCandidate.stats.movieScore) > 0) {
          break;
        }
      }
      
      generatedBatch.push(bestCandidate);
    }
    
    generatedBatch.sort((a, b) => {
      const scoreA = parseFloat(a.stats.movieScore);
      const scoreB = parseFloat(b.stats.movieScore);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.stats.avgComp - a.stats.avgComp;
    });

    setGeneratedScripts(generatedBatch);
    return { scripts: generatedBatch };
  }, [runGenerationAlgorithm, maxTagSlots]);

  const togglePin = useCallback((uniqueId) => {
    const existingIndex = pinnedScripts.findIndex(s => String(s.uniqueId) === String(uniqueId));
    
    if (existingIndex > -1) {
      // UNPIN: Remove from list
      const newPinned = [...pinnedScripts];
      newPinned.splice(existingIndex, 1);
      savePinnedScripts(newPinned);
    } else {
      // PIN: Add to list
      const script = generatedScripts.find(s => String(s.uniqueId) === String(uniqueId));
      if (script) {
        const newPinned = JSON.parse(JSON.stringify(script));
        if (!newPinned.name) newPinned.name = "UNTITLED SCRIPT";
        savePinnedScripts([...pinnedScripts, newPinned]);
      }
    }
  }, [generatedScripts, pinnedScripts, savePinnedScripts]);

  // Pin an external script (e.g., from Synergy tab)
  const pinScript = useCallback((script) => {
    // Check if already pinned by uniqueId
    const existingIndex = pinnedScripts.findIndex(s => String(s.uniqueId) === String(script.uniqueId));
    if (existingIndex > -1) {
      return { error: 'Script is already pinned' };
    }
    
    const newPinned = JSON.parse(JSON.stringify(script));
    if (!newPinned.name) newPinned.name = "UNTITLED SCRIPT";
    savePinnedScripts([...pinnedScripts, newPinned]);
    return { success: true };
  }, [pinnedScripts, savePinnedScripts]);

  // Unpin by uniqueId
  const unpinScript = useCallback((uniqueId) => {
    const newPinned = pinnedScripts.filter(s => String(s.uniqueId) !== String(uniqueId));
    savePinnedScripts(newPinned);
  }, [pinnedScripts, savePinnedScripts]);

  const updateScriptName = useCallback((uniqueId, newName) => {
    const newPinned = pinnedScripts.map(s => 
      s.uniqueId === uniqueId ? { ...s, name: newName } : s
    );
    savePinnedScripts(newPinned);
  }, [pinnedScripts, savePinnedScripts]);

  const exportPinnedScripts = useCallback(() => {
    if (pinnedScripts.length === 0) {
      return { error: "No pinned scripts to save." };
    }
    
    const dataStr = JSON.stringify(pinnedScripts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const exportName = `hollywood_animal_scripts_${new Date().toISOString().slice(0, 10)}.json`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", exportName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    
    return { success: true };
  }, [pinnedScripts]);

  const importPinnedScripts = useCallback((jsonData) => {
    try {
      const loaded = JSON.parse(jsonData);
      if (Array.isArray(loaded)) {
        let added = 0;
        const currentIds = new Set(pinnedScripts.map(s => String(s.uniqueId)));
        const newPinned = [...pinnedScripts];
        
        loaded.forEach(script => {
          if (script.tags && script.uniqueId) {
            const sId = String(script.uniqueId);
            if (!currentIds.has(sId)) {
              newPinned.push(script);
              currentIds.add(sId);
              added++;
            }
          }
        });
        
        if (added > 0) {
          savePinnedScripts(newPinned);
          return { success: true, added };
        } else {
          return { error: "No new unique scripts found in file." };
        }
      } else {
        return { error: "Invalid file format: JSON is not an array." };
      }
    } catch (err) {
      return { error: "Error parsing JSON file." };
    }
  }, [pinnedScripts, savePinnedScripts]);

  const getExcludedTagsForStarterProfile = useCallback(() => {
    const whitelist = new Set(starterWhitelist);
    return Object.values(tags)
      .filter(tag => !whitelist.has(tag.id))
      .map(tag => ({ id: tag.id, percent: 1.0, category: tag.category }));
  }, [tags, starterWhitelist]);

  // Clear save-based pinned scripts (called when save is cleared)
  const clearSavePins = useCallback(() => {
    const userPins = pinnedScripts.filter(s => !s.fromSave);
    savePinnedScripts(userPins);
  }, [pinnedScripts, savePinnedScripts]);

  // Refresh save pins from current moviesInProduction
  const refreshSavePins = useCallback(() => {
    if (!moviesInProduction || moviesInProduction.length === 0) {
      // Clear all save pins if no movies in production
      const userPins = pinnedScripts.filter(s => !s.fromSave);
      savePinnedScripts(userPins);
      return;
    }
    
    // Convert all movies to scripts
    const saveScripts = moviesInProduction
      .map(m => convertMovieToScript(m))
      .sort((a, b) => a.currentStage - b.currentStage);
    
    // Keep user pins at top
    const userPins = pinnedScripts.filter(s => !s.fromSave);
    savePinnedScripts([...userPins, ...saveScripts]);
  }, [moviesInProduction, pinnedScripts, convertMovieToScript, savePinnedScripts]);

  return {
    generatedScripts,
    pinnedScripts: sortedPinnedScripts,
    generateScripts,
    togglePin,
    pinScript,
    unpinScript,
    updateScriptName,
    exportPinnedScripts,
    importPinnedScripts,
    getExcludedTagsForStarterProfile,
    clearSavePins,
    refreshSavePins
  };
}
