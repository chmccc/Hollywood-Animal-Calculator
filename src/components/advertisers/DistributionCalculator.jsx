import LayoutCard from '../common/LayoutCard';

function DistributionCalculator({ comScore, ownedScreenings, onOwnedScreeningsChange, distributionResults, isFromSave }) {
  return (
    <div id="dist-calc-anchor">
      <LayoutCard 
        className="result-card"
        title="Distribution Calculator"
        subtitle={<>Screenings needed for independent distribution.<br />Adjust the Commercial Score above to see changes.</>}
        headerActions={
          isFromSave && (
            <span 
              className="save-indicator"
              title="Screenings loaded from save file"
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '4px',
                color: 'var(--accent)'
              }}
            >
              Screening Count Loaded From Save
            </span>
          )
        }
      >
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
      </LayoutCard>
    </div>
  );
}

export default DistributionCalculator;
