import Card from '../common/Card';

function DistributionCalculator({ comScore, ownedScreenings, onOwnedScreeningsChange, distributionResults, isFromSave }) {
  return (
    <div id="dist-calc-anchor" style={{ marginTop: '25px' }}>
      <Card 
        className="result-card" 
        style={{ borderLeft: '4px solid var(--accent)', transition: 'all 0.5s ease' }}
      >
        <div className="card-header">
          <h3>Distribution Calculator</h3>
          {isFromSave && (
            <span 
              className="save-indicator"
              title="Value loaded from save file"
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '4px',
                color: 'var(--accent)',
                marginLeft: 'auto'
              }}
            >
              From Save
            </span>
          )}
        </div>
        
        <div className="dist-input-row">
          <div className="dist-input-group">
            <label htmlFor="ownedScreeningsInput">Owned Theatres (Screenings)</label>
            <input
              type="number"
              id="ownedScreeningsInput"
              className="screenings-input"
              value={ownedScreenings}
              onChange={(e) => onOwnedScreeningsChange(parseInt(e.target.value) || 0)}
              min={0}
              step={1}
              style={isFromSave ? { borderColor: 'rgba(212, 175, 55, 0.5)' } : undefined}
            />
          </div>
          <div className="dist-info-group">
            <span className="subtitle" style={{ margin: 0, fontSize: '0.85rem' }}>
              Based on Target Commercial Score: <strong style={{ color: 'var(--accent)' }}>{comScore.toFixed(1)}</strong>
            </span>
          </div>
        </div>
        
        <p className="subtitle" style={{ marginTop: '-10px', marginBottom: '20px' }}>
          Screenings needed for independent distribution. Adjust the <strong>Commercial Score</strong> above to see changes.
        </p>

        <div id="dist-results-grid" className="dist-grid">
          {distributionResults.map((val, index) => (
            <div 
              key={index}
              className="week-box"
              style={{ borderColor: val > 0 ? 'rgba(212, 175, 55, 0.3)' : undefined }}
            >
              <span className="week-label">Week {index + 1}</span>
              <span className={`week-val ${val > 0 ? 'active' : ''}`}>
                {val.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default DistributionCalculator;
