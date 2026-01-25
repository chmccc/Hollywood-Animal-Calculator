import './LayoutCard.css';

/**
 * Art Deco corner ornament SVG - stepped/tiered corner pattern
 */
function CornerOrnament({ position }) {
  return (
    <svg 
      className={`corner-ornament-svg ${position}`}
      viewBox="0 0 32 32" 
      aria-hidden="true"
    >
      {/* Stepped corner pattern */}
      <path 
        d="M0 0 L32 0 L32 3 L3 3 L3 32 L0 32 Z" 
        fill="currentColor"
      />
      <path 
        d="M6 6 L24 6 L24 9 L9 9 L9 24 L6 24 Z" 
        fill="currentColor"
        opacity="0.6"
      />
      <path 
        d="M12 12 L18 12 L18 14 L14 14 L14 18 L12 18 Z" 
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}

/**
 * Art Deco header flourish SVG - decorative element flanking the title
 */
function HeaderFlourish({ flip = false }) {
  // Both use xMinYMid - the CSS scaleX(-1) flip will mirror the right one to align at the right edge
  return (
    <svg 
      className={`header-flourish ${flip ? 'flip' : ''}`}
      viewBox="0 0 60 20" 
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      <g>
        {/* Central diamond */}
        <path 
          d="M4 10 L8 6 L12 10 L8 14 Z" 
          fill="currentColor"
        />
        {/* Extending lines */}
        <path 
          d="M14 9 L60 9 L60 11 L14 11 Z" 
          fill="currentColor"
        />
        {/* Small accent diamonds */}
        <path 
          d="M20 10 L22 8 L24 10 L22 12 Z" 
          fill="currentColor"
          opacity="0.6"
        />
        <path 
          d="M32 10 L34 8 L36 10 L34 12 Z" 
          fill="currentColor"
          opacity="0.4"
        />
        {/* Chevron accent */}
        <path 
          d="M44 7 L48 10 L44 13 L45 10 Z" 
          fill="currentColor"
          opacity="0.3"
        />
      </g>
    </svg>
  );
}

/**
 * LayoutCard - Art Deco styled card component inspired by Hollywood Animal game UI
 * 
 * Props:
 * - id: Optional HTML id attribute
 * - title: Optional header title
 * - subtitle: Optional subtitle text (rendered below header with actions)
 * - children: Card content
 * - className: Additional CSS classes
 * - headerActions: Optional React node for subtitle row (buttons, etc.)
 * - accentBorder: 'top' | 'left' | 'none' - position of accent border highlight
 * - style: Additional inline styles
 */
function LayoutCard({ 
  id,
  title, 
  subtitle,
  children, 
  className = '', 
  headerActions = null,
  accentBorder = 'none',
  style = {}
}) {
  const accentClass = accentBorder !== 'none' ? `accent-${accentBorder}` : '';
  
  return (
    <div id={id} className={`layout-card ${accentClass} ${className}`.trim()} style={style}>
      {/* Vignette overlay */}
      <div className="layout-card-vignette" aria-hidden="true" />
      
      {/* Corner ornaments */}
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />
      
      {/* Optional header with centered title */}
      {title && (
        <div className="layout-card-header">
          <HeaderFlourish />
          <h3>{title}</h3>
          <HeaderFlourish flip />
          <span className="layout-card-header-diamond" aria-hidden="true" />
        </div>
      )}
      
      {/* Content */}
      <div className="layout-card-content">
        {/* Subtitle row with optional actions */}
        {(subtitle || headerActions) && (
          <div className="layout-card-subtitle-row">
            {subtitle && <p className="subtitle">{subtitle}</p>}
            {headerActions && (
              <div className="layout-card-actions">
                {headerActions}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default LayoutCard;
