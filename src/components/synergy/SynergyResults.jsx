import { formatScore, formatSimpleScore, formatFinalRating } from '../../utils/calculations';
import TargetAudience from '../advertisers/TargetAudience';
import LayoutCard from '../common/LayoutCard';
import Button from '../common/Button';
import ScriptSummary from './ScriptSummary';

function SynergyResults({ results, audienceData, onTransfer, onPin, isPinned = false, selectedTags = [], genrePercents = {} }) {
  const {
    rawAverage,
    totalScore,
    spoilers,
    bonuses,
    displayCom,
    displayArt,
    tagCap,
    ngCount
  } = results;

  const avgColor = rawAverage >= 3.5 ? 'var(--success)' : rawAverage < 2.5 ? 'var(--danger)' : '#fff';
  const baseScoreColor = totalScore >= 0 ? 'var(--success)' : 'var(--danger)';

  return (
    <div id="results-synergy" className="results-container">
      <div className="summary-row">
        <div className="summary-item">
          <h3>Average Compatibility</h3>
          <div 
            className="summary-value" 
            style={{ color: avgColor }}
          >
            {rawAverage.toFixed(1)} <span className="sub-value">/ 5.0</span>
          </div>
        </div>
        <div className="summary-item">
          <h3>Script Synergy</h3>
          <div 
            className="summary-value"
            style={{ color: baseScoreColor }}
          >
            {formatScore(totalScore)}
          </div>
        </div>
      </div>

      <LayoutCard 
        className="result-card"
        title="Bonuses"
        subtitle="Script synergy is the foundation of your movie score, scaled by your scriptwriter's skill."
      >
        <div className="breakdown-row">
          <span className="b-label">Script Synergy:</span>
          <span 
            className="b-value"
            style={{ color: baseScoreColor }}
          >
            {formatScore(totalScore)}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="b-label">Commercial Bonus:</span>
          <span 
            className="b-value"
            style={{ color: bonuses.com > 0 ? 'var(--success)' : bonuses.com < 0 ? 'var(--danger)' : '#fff' }}
          >
            {formatSimpleScore(bonuses.com)}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="b-label">Artistic Bonus:</span>
          <span 
            className="b-value"
            style={{ color: bonuses.art > 0 ? '#a0a0ff' : bonuses.art < 0 ? 'var(--danger)' : '#fff' }}
          >
            {formatSimpleScore(bonuses.art)}
          </span>
        </div>
      </LayoutCard>

      <LayoutCard 
        className="result-card"
        title="Potential Movie Score"
        subtitle={<>Max Score Capped at <strong>{tagCap}.0</strong> ({ngCount} Scoring Elements)</>}
      >
        <div className="total-row">
          <span className="t-label">Commercial Movie Score:</span>
          <span 
            className="t-value"
            style={{ color: displayCom > 0 ? 'var(--accent)' : 'var(--danger)' }}
          >
            {formatFinalRating(displayCom)}
          </span>
        </div>
        <div className="total-row">
          <span className="t-label">Artistic Movie Score:</span>
          <span 
            className="t-value"
            style={{ color: displayArt > 0 ? '#a0a0ff' : 'var(--danger)' }}
          >
            {formatFinalRating(displayArt)}
          </span>
        </div>
      </LayoutCard>

      {audienceData && (
        <TargetAudience
          targetAudiences={audienceData.targetAudiences}
          thresholds={audienceData.thresholds}
        />
      )}

      <LayoutCard 
        className="result-card"
        title="Conflicts"
        subtitle="Severe clashes that ruin the script."
      >
        <div className="strategy-content">
          {spoilers.length > 0 ? (
            [...new Set(spoilers)].map((spoiler, index) => (
              <div 
                key={index}
                style={{ 
                  color: 'var(--danger)', 
                  padding: '4px 0', 
                  borderBottom: '1px solid #444' 
                }}
              >
                {spoiler}
              </div>
            ))
          ) : (
            <div style={{ color: '#888', fontStyle: 'italic' }}>
              No severe conflicts found.
            </div>
          )}
        </div>
      </LayoutCard>

      <ScriptSummary 
        selectedTags={selectedTags} 
        genrePercents={genrePercents} 
      />

      {(onTransfer || onPin) && (
        <div className="action-area" style={{ marginTop: 0, display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onPin && (
            <Button 
              variant={isPinned ? 'ghost' : 'primary'}
              size="md"
              onClick={onPin}
              disabled={isPinned}
              title={isPinned ? '★ Pinned' : '☆ Pin Script'}
            />
          )}
          {onTransfer && (
            <Button 
              size="md"
              variant="primary"
              onClick={onTransfer}
              title="Find Best Advertisers →"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default SynergyResults;
