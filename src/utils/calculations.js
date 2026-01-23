// Calculation utilities ported from script.js

export function calculateMatrixScore(selectedTags, allTags, compatibility) {
  let totalScore = 0;
  let spoilers = [];
  let rawSum = 0;
  let pairCount = 0;

  // Calculate raw average from all pairs
  for (let i = 0; i < selectedTags.length; i++) {
    for (let j = i + 1; j < selectedTags.length; j++) {
      let tA = selectedTags[i];
      let tB = selectedTags[j];
      let rawVal = 3.0;
      if (compatibility[tA.id] && compatibility[tA.id][tB.id]) {
        rawVal = parseFloat(compatibility[tA.id][tB.id]);
      } else if (compatibility[tB.id] && compatibility[tB.id][tA.id]) {
        rawVal = parseFloat(compatibility[tB.id][tA.id]);
      }
      rawSum += rawVal;
      pairCount++;
    }
  }

  let rawAverage = pairCount > 0 ? (rawSum / pairCount) : 3.0;

  // Calculate weighted score for each tag
  selectedTags.forEach(tagA => {
    let rowSum = 0;
    let rowWeight = 0;
    let worstVal = 6.0;
    let worstPartner = "";

    selectedTags.forEach(tagB => {
      if (tagA.id === tagB.id) return;

      let rawVal = 3.0;
      if (compatibility[tagA.id] && compatibility[tagA.id][tagB.id]) {
        rawVal = parseFloat(compatibility[tagA.id][tagB.id]);
      } else if (compatibility[tagB.id] && compatibility[tagB.id][tagA.id]) {
        rawVal = parseFloat(compatibility[tagB.id][tagA.id]);
      }

      let score = (rawVal - 3.0) / 2.0;
      let weight = 1.0;

      if (score < 0) {
        if (tagB.category === "Genre") {
          score *= 20.0 * tagB.percent;
          weight = 20.0 * tagB.percent;
        } else if (tagB.category === "Setting") {
          score *= 5.0;
          weight = 5.0;
        } else {
          score *= 3.0;
          weight = 3.0;
        }
      } else {
        if (tagB.category === "Genre") {
          score *= tagB.percent;
          weight = tagB.percent;
        }
      }

      rowSum += score;
      rowWeight += weight;

      if (rawVal < worstVal) {
        worstVal = rawVal;
        worstPartner = tagB.id;
      }
    });

    let rowAverage = 0;
    if (rowWeight > 0) rowAverage = rowSum / rowWeight;

    let transformedWorst = (worstVal - 3.0) / 2.0;
    let finalRowScore = rowAverage;

    if (worstVal <= 1.0) {
      const partnerName = worstPartner && allTags[worstPartner] ? allTags[worstPartner].name : "another selected tag";
      spoilers.push(`${allTags[tagA.id]?.name || tagA.id} conflicts with ${partnerName}`);
      finalRowScore = -1.0;
    } else if (transformedWorst < rowAverage) {
      finalRowScore = transformedWorst;
    }

    totalScore += finalRowScore * tagA.percent;
  });

  if (totalScore >= 0) totalScore *= 0.9;
  else totalScore *= 1.25;

  return { totalScore, spoilers, rawAverage };
}

export function calculateTotalBonuses(selectedTags, allTags, genrePairs) {
  let totalArt = 0;
  let totalCom = 0;

  const genrePair = calculateGenrePairScore(selectedTags, allTags, genrePairs);
  if (genrePair) {
    totalArt += genrePair.art;
    totalCom += genrePair.com;
  } else {
    const genres = selectedTags.filter(t => t.category === "Genre").sort((a, b) => b.percent - a.percent);
    if (genres.length > 0) {
      const topGenre = allTags[genres[0].id];
      if (topGenre) {
        totalArt += topGenre.art;
        totalCom += topGenre.com;
      }
    }
  }

  selectedTags.forEach(tag => {
    if (tag.category !== "Genre") {
      const data = allTags[tag.id];
      if (data) {
        totalArt += data.art;
        totalCom += data.com;
      }
    }
  });

  return { art: totalArt, com: totalCom };
}

export function calculateGenrePairScore(selectedTags, allTags, genrePairs) {
  const genres = selectedTags.filter(t => t.category === "Genre").sort((a, b) => b.percent - a.percent);
  if (genres.length < 2) return null;

  const g1 = genres[0];
  const g2 = genres[1];

  if ((g1.percent + g2.percent < 0.7) || (g2.percent < 0.35)) {
    return null;
  }

  let pairData = null;
  if (genrePairs[g1.id] && genrePairs[g1.id][g2.id]) {
    pairData = genrePairs[g1.id][g2.id];
  } else if (genrePairs[g2.id] && genrePairs[g2.id][g1.id]) {
    pairData = genrePairs[g2.id][g1.id];
  }

  if (!pairData) return null;

  return {
    com: parseFloat(pairData.Item1),
    art: parseFloat(pairData.Item2),
    names: `${allTags[g1.id]?.name || g1.id} + ${allTags[g2.id]?.name || g2.id}`
  };
}

export function getScoringElementCount(tags) {
  return tags.filter(t => t.category !== "Genre" && t.category !== "Setting").length;
}

export function formatScore(num) {
  if (Math.abs(num) < 0.005) return "0";
  return (num > 0 ? "+" : "") + num.toFixed(2);
}

export function formatSimpleScore(num) {
  if (Math.abs(num) < 0.005) return "0";
  return (num > 0 ? "+" : "") + parseFloat(num.toFixed(2));
}

export function formatFinalRating(val) {
  if (val >= 10) return "10.0";
  return val.toFixed(1);
}
