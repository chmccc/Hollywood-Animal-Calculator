import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { calculateMatrixScore, calculateTotalBonuses, getScoringElementCount } from '../utils/calculations';

export function useSynergyCalculation() {
  const { tags, compatibility, genrePairs } = useApp();

  const calculateSynergy = useCallback((selectedTags) => {
    if (selectedTags.length === 0) {
      return null;
    }

    const matrixResult = calculateMatrixScore(selectedTags, tags, compatibility);
    const bonuses = calculateTotalBonuses(selectedTags, tags, genrePairs);
    
    // Tag Cap Logic
    const ngCount = getScoringElementCount(selectedTags);
    
    let tagCap = 6;
    if (ngCount >= 9) tagCap = 9;
    else if (ngCount >= 7) tagCap = 8;
    else if (ngCount >= 5) tagCap = 7;

    const MAX_GAME_SCORE = 9.9;
    const totalComRaw = matrixResult.totalScore + bonuses.com;
    const totalArtRaw = matrixResult.totalScore + bonuses.art;
    
    let displayCom = Math.max(0, totalComRaw * MAX_GAME_SCORE);
    let displayArt = Math.max(0, totalArtRaw * MAX_GAME_SCORE);

    displayCom = Math.min(tagCap, displayCom);
    displayArt = Math.min(tagCap, displayArt);

    return {
      rawAverage: matrixResult.rawAverage,
      totalScore: matrixResult.totalScore,
      spoilers: matrixResult.spoilers,
      bonuses,
      displayCom,
      displayArt,
      tagCap,
      ngCount
    };
  }, [tags, compatibility, genrePairs]);

  return { calculateSynergy };
}
