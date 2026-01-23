import { useEffect, useRef } from 'react';

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.1,
  sliderClass = 'com-slider',
  color = '#d4af37',
  subtitle = null
}) {
  const sliderRef = useRef(null);

  useEffect(() => {
    updateSliderTrack();
  }, [value, min, max]);

  const updateSliderTrack = () => {
    if (sliderRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #444 ${percentage}%, #444 100%)`;
    }
  };

  const handleSliderChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (val > max) val = max;
    if (val < min) val = min;
    onChange(val);
  };

  return (
    <div className="score-control-group">
      <div className="score-label-row">
        <label>{label}</label>
        <input
          type="number"
          className="score-number-display"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
        />
      </div>
      <div className="range-wrapper">
        <input
          ref={sliderRef}
          type="range"
          className={`styled-slider ${sliderClass}`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
        />
      </div>
      {subtitle && (
        <p className="subtitle" style={{ marginTop: '10px', fontSize: '0.8rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default Slider;
