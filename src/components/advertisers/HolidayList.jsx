import Card from '../common/Card';

function HolidayList({ viableHolidays }) {
  return (
    <Card className="result-card">
      <h3>Holiday Release</h3>
      <div id="holidayDisplay" className="holiday-list-container">
        {viableHolidays.length === 0 ? (
          <div className="holiday-row-empty">
            <span>No beneficial holidays found for your primary audience.</span>
          </div>
        ) : (
          <>
            {/* Best Option */}
            <div className="holiday-section-label">Best Option</div>
            <div className="holiday-row best">
              <div className="hol-left">
                <span className="hol-name">{viableHolidays[0].name}</span>
                <span className="hol-target">{viableHolidays[0].contextText}</span>
              </div>
            </div>

            {/* Alternatives */}
            {viableHolidays.length > 1 && (
              <>
                <div className="holiday-section-label" style={{ marginTop: '20px' }}>
                  Alternatives
                </div>
                {viableHolidays.slice(1, 4).map((holiday, index) => (
                  <div key={index} className="holiday-row">
                    <div className="hol-left">
                      <span className="hol-name">{holiday.name}</span>
                      <span className="hol-target">{holiday.contextText}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default HolidayList;
