import LayoutCard from '../common/LayoutCard';

function TargetAudience({ targetAudiences, thresholds }) {
  return (
    <LayoutCard 
      className="result-card"
      title="Target Audience"
      headerActions={
        <div className="audience-legend">
          <div className="legend-item">
            <span className="legend-dot best"></span> High Interest
          </div>
          <div className="legend-item">
            <span className="legend-dot moderate"></span> Moderate Interest
          </div>
        </div>
      }
    >
      <div id="targetAudienceDisplay" className="landscape-content">
        {targetAudiences.length > 0 ? (
          targetAudiences.map(d => {
            const tierClass = d.score >= thresholds.THRESHOLD_GOOD ? 'pill-best' : 'pill-moderate';
            return (
              <div key={d.id} className={`audience-pill ${tierClass}`}>
                {d.name}
              </div>
            );
          })
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.95rem' }}>
            No audience fits the criteria.
          </div>
        )}
      </div>
    </LayoutCard>
  );
}

export default TargetAudience;
