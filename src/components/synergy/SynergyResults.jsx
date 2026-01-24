import { formatScore, formatSimpleScore, formatFinalRating } from '../../utils/calculations';
import TargetAudience from '../advertisers/TargetAudience';

function SynergyResults({ results, audienceData, onTransfer, onPin, isPinned = false }) {
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

      <div className="card result-card breakdown-container">
        <div className="breakdown-col left-col">
          <h4 className="col-header">Bonuses</h4>
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
          <p className="context-text">
            Script synergy is the foundation of your movie score, scaled by your scriptwriter's skill.
          </p>
        </div>
        <div className="breakdown-col right-col">
          <h4 className="col-header highlight-header">Potential Movie Score</h4>
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
          <div 
            style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              marginTop: '10px',
              textAlign: 'right' 
            }}
          >
            Max Score Capped at <strong>{tagCap}.0</strong> ({ngCount} Scoring Elements)
          </div>
        </div>
      </div>

      <div className="card result-card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h3>Conflicts</h3>
        <div className="list-subtitle">Severe clashes that ruin the script</div>
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
      </div>

      {audienceData && (
        <TargetAudience
          targetAudiences={audienceData.targetAudiences}
          thresholds={audienceData.thresholds}
        />
      )}

      {(onTransfer || onPin) && (
        <div className="action-area" style={{ marginTop: 0, display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onPin && (
            <button 
              className={`analyze-btn ${isPinned ? 'pinned-btn' : ''}`}
              onClick={onPin}
              disabled={isPinned}
              title={isPinned ? 'Already pinned' : 'Pin this script'}
              style={isPinned ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {isPinned ? '★ Pinned' : '☆ Pin Script'}
            </button>
          )}
          {onTransfer && (
            <button 
              className="analyze-btn secondary-btn"
              onClick={onTransfer}
            >
              Find Best Advertisers →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SynergyResults;
