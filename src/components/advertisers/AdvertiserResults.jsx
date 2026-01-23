import Card from '../common/Card';

function AdvertiserResults({ validAgents, movieLean, leanText, hasTargetAudience }) {
  const leanColor = movieLean === 1 ? '#a0a0ff' : movieLean === 2 ? '#d4af37' : '#fff';

  const getTypeLabel = (type) => {
    if (type === 0) return "Univ.";
    if (type === 1) return "Art";
    return "Com";
  };

  return (
    <Card className="result-card">
      <h3>Recommended Advertisers</h3>
      <div className="list-subtitle">Ranked from Highest to Lowest</div>
      <div className="strategy-content">
        <div className="stat-row">
          <span className="label">Movie Lean Towards:</span>
          <span className="value" style={{ color: leanColor }}>{leanText}</span>
        </div>
        <div id="adAgentDisplay">
          {!hasTargetAudience ? (
            <div style={{ color: '#666', fontStyle: 'italic', padding: '10px 0' }}>
              Identify a target audience first.
            </div>
          ) : validAgents.length === 0 ? (
            <div style={{ color: '#d4af37', padding: '10px 0' }}>
              No specific advertisers found.
            </div>
          ) : (
            validAgents.map((agent, index) => (
              <div key={index} className="advertiser-row">
                <span className="advertiser-name">{agent.name}</span>
                <span className="advertiser-type">{getTypeLabel(agent.type)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default AdvertiserResults;
