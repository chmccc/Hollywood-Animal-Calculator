import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { DEMOGRAPHICS, AD_AGENTS, HOLIDAYS, CONSTANTS } from '../data/gameData';

export function useAudienceAnalysis() {
  const { tags } = useApp();

  const analyzeMovie = useCallback((tagInputs, inputCom, inputArt) => {
    if (tagInputs.length === 0) {
      return null;
    }

    // Calculate tag affinity for each demographic
    let tagAffinity = { "YM": 0, "YF": 0, "TM": 0, "TF": 0, "AM": 0, "AF": 0 };
    tagInputs.forEach(item => {
      const tagData = tags[item.id];
      if (!tagData) return;
      const multiplier = item.percent;
      for (let demo in tagAffinity) {
        if (tagData.weights[demo]) {
          tagAffinity[demo] += (tagData.weights[demo] * multiplier);
        }
      }
    });

    // Normalize affinity values
    let minVal = Number.MAX_VALUE;
    for (let demo in tagAffinity) {
      if (tagAffinity[demo] < minVal) minVal = tagAffinity[demo];
    }
    if (minVal < 1.0) {
      const liftAmount = 1.0 - minVal;
      for (let demo in tagAffinity) {
        tagAffinity[demo] += liftAmount;
      }
    }

    let totalSum = 0;
    for (let demo in tagAffinity) totalSum += tagAffinity[demo];
    
    const RELEASE_MAGIC_NUMBER = 3.0;
    let baselineScores = {};
    for (let demo in tagAffinity) {
      if (totalSum === 0) {
        baselineScores[demo] = 0;
      } else {
        let normalized = (tagAffinity[demo] / totalSum) * RELEASE_MAGIC_NUMBER;
        baselineScores[demo] = Math.min(1.0, Math.max(0, normalized));
      }
    }

    const normalizedArt = inputArt / 10.0;
    const normalizedCom = inputCom / 10.0;
    let demoGrades = [];
    
    for (let demo in DEMOGRAPHICS) {
      const d = DEMOGRAPHICS[demo];
      const dropRate = baselineScores[demo];

      const skew = normalizedArt - normalizedCom;
      let satArt, satBase, satCom;
      if (skew > 0) {
        satArt = 1.0;
        satBase = 1.0 - skew;
        satCom = 1.0 - skew;
      } else {
        satCom = 1.0;
        satBase = 1.0 - Math.abs(skew);
        satArt = 1.0 - Math.abs(skew);
      }

      const totalW = d.baseW + d.artW + d.comW;
      const satisfaction = ((satBase * d.baseW) + (satArt * d.artW) + (satCom * d.comW)) / totalW;
      const qw = CONSTANTS.KINOMARK.scoreWeights;
      const quality = (dropRate * qw[0]) + (normalizedCom * qw[1]) + (normalizedArt * qw[2]);
      const aw = CONSTANTS.KINOMARK.audienceWeight;
      let finalScore = (satisfaction * aw) + (quality * (1 - aw));
      
      if (dropRate <= 0.1) finalScore = 0;

      demoGrades.push({
        id: demo,
        name: d.name,
        score: dropRate,
        utility: finalScore
      });
    }

    const THRESHOLD_GOOD = 0.67;
    const THRESHOLD_BAD = 0.33;

    const targetAudiences = demoGrades.filter(d => d.score > THRESHOLD_BAD);
    const highInterestIds = demoGrades.filter(d => d.score >= THRESHOLD_GOOD).map(d => d.id);
    const moderateInterestIds = demoGrades.filter(d => d.score > THRESHOLD_BAD && d.score < THRESHOLD_GOOD).map(d => d.id);

    // Calculate movie lean
    let movieLean = 0; // 0 = Balanced, 1 = Artistic, 2 = Commercial
    let leanText = "Balanced";
    if (inputArt > inputCom + 0.1) { movieLean = 1; leanText = "Artistic"; }
    else if (inputCom > inputArt + 0.1) { movieLean = 2; leanText = "Commercial"; }

    // Find valid advertisers
    const validTargetIds = targetAudiences.map(t => t.id);
    let validAgents = [];
    if (validTargetIds.length > 0) {
      validAgents = AD_AGENTS.filter(agent => {
        return agent.targets.some(t => validTargetIds.includes(t));
      }).map(agent => {
        let score = 0;
        validTargetIds.forEach(targetId => {
          if (agent.targets.includes(targetId)) {
            score += 5;
          }
        });
        if (agent.type !== 0 && agent.type !== movieLean) score -= 10;
        score += agent.level;
        return { ...agent, score };
      });
      validAgents = validAgents.filter(a => a.score > 0);
      validAgents.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.level !== a.level) return b.level - a.level;
        return a.name.localeCompare(b.name);
      });
    }

    // Calculate holidays
    let primaryTargets = highInterestIds;
    if (primaryTargets.length === 0) {
      primaryTargets = moderateInterestIds;
    }

    const rankedHolidays = HOLIDAYS.map(h => {
      let totalScore = 0;
      let parts = [];
      primaryTargets.forEach(id => {
        const bonus = h.bonuses[id] || 0;
        if (bonus > 0) {
          totalScore += bonus;
          parts.push({
            val: bonus,
            text: `${bonus}% Bonus Towards ${DEMOGRAPHICS[id].name}`
          });
        }
      });
      parts.sort((a, b) => b.val - a.val);
      const contextText = parts.length > 0 ? parts.map(p => p.text).join(', ') : "No significant bonus.";
      return {
        name: h.name,
        totalScore: totalScore,
        contextText: contextText
      };
    });

    const viableHolidays = rankedHolidays.filter(h => h.totalScore > 0).sort((a, b) => b.totalScore - a.totalScore);

    // Calculate campaign duration
    let preDuration = 6;
    let releaseDuration = 4;
    let postDuration = 0;
    let totalWeeks = 10;
    if (inputCom >= 9.0) {
      postDuration = 4;
      totalWeeks = 14;
    }

    return {
      targetAudiences: targetAudiences.sort((a, b) => b.score - a.score),
      highInterestIds,
      moderateInterestIds,
      movieLean,
      leanText,
      validAgents: validAgents.slice(0, 4),
      viableHolidays,
      campaign: {
        preDuration,
        releaseDuration,
        postDuration,
        totalWeeks
      },
      thresholds: {
        THRESHOLD_GOOD,
        THRESHOLD_BAD
      }
    };
  }, [tags]);

  const calculateDistribution = useCallback((commercialScore, availableScreenings) => {
    const BASE = 1000;
    const W1_MULT = 2;
    const W2_MULT = 1;
    const DECAY = 0.8;

    const rawW1 = (commercialScore * W1_MULT * BASE) - availableScreenings;
    const w1 = Math.max(0.0, rawW1);

    const rawW2 = (commercialScore * W2_MULT * BASE) - availableScreenings;
    const w2 = Math.max(0.0, rawW2);

    let calcValues = [w1, w2];
    let currentDecayBase = w2;

    for (let i = 2; i < 8; i++) {
      currentDecayBase *= DECAY;
      calcValues.push(currentDecayBase);
    }

    return calcValues.map((val, index) => {
      return index < 4 ? Math.ceil(val) : Math.floor(val);
    });
  }, []);

  return { analyzeMovie, calculateDistribution };
}
