import LayoutCard from '../common/LayoutCard';

// Fixed display order: Boys, Girls, Young Men, Young Women, Men, Women
const AUDIENCE_ORDER = ['TM', 'TF', 'YM', 'YF', 'AM', 'AF'];

function TargetAudience({ targetAudiences, thresholds }) {
  // Sort audiences by fixed order to prevent re-ordering on score changes
  const sortedAudiences = [...targetAudiences].sort((a, b) => {
    return AUDIENCE_ORDER.indexOf(a.id) - AUDIENCE_ORDER.indexOf(b.id);
  });

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
        {sortedAudiences.length > 0 ? (
          sortedAudiences.map(d => {
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
