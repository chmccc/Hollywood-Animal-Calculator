import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';

const CATEGORY_ORDER = [
  "Genre", "Setting", "Protagonist", "Antagonist", "Supporting Character", "Theme & Event", "Finale"
];

function ScriptCard({ script, isPinned, onTogglePin, onNameChange, onTransfer, onExcludeTag, lockedTagIds = new Set() }) {
  const { tags } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const compClass = script.stats.avgComp >= 4.0 ? 'val-high' : script.stats.avgComp >= 3.0 ? 'val-mid' : 'val-low';

  const sortedTags = [...script.tags].sort((a, b) => {
    let idxA = CATEGORY_ORDER.indexOf(a.category);
    let idxB = CATEGORY_ORDER.indexOf(b.category);
    if (idxA === -1) idxA = 99;
    if (idxB === -1) idxB = 99;
    return idxA - idxB;
  });

  const handleHeaderClick = (e) => {
    // Don't toggle if clicking on input or pin button
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsExpanded(!isExpanded);
  };

  const handleTransfer = () => {
    if (onTransfer) {
      onTransfer(script);
    }
  };

  return (
    <div className="gen-card" data-id={script.uniqueId}>
      <div className="gen-header" onClick={handleHeaderClick}>
        <div className="gen-left-col">
          <div className="script-name-row">
            {onNameChange ? (
              <input
                type="text"
                className="script-name-input"
                value={(script.name || 'Untitled Script').toUpperCase()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onNameChange(e.target.value.toUpperCase())}
                placeholder="SCRIPT NAME"
                style={{ textTransform: 'uppercase' }}
              />
            ) : (
              <span className="script-name-display">{(script.name || 'Untitled Script').toUpperCase()}</span>
            )}
          </div>
          {!script.fromSave && (
            <div className="gen-info-row">
              <div className="gen-badge-group">
                <span className="gen-badge-label">Avg Comp</span>
                <span className={`gen-badge-val ${compClass}`}>
                  {script.stats.avgComp.toFixed(1)}
                </span>
              </div>
              <div className="gen-badge-group">
                <span className="gen-badge-label">Movie Score</span>
                <span className="gen-badge-val val-mid">{script.stats.movieScore}</span>
              </div>
              <div className="gen-badge-group">
                <span className="gen-badge-label">Script Qual</span>
                <span className="gen-badge-val val-mid">{script.stats.maxScriptQuality}</span>
              </div>
            </div>
          )}
        </div>
        {script.fromSave && script.phaseName && (
          <span className="production-phase-badge">{script.phaseName}</span>
        )}
        <Button
          size="icon"
          variant={isPinned ? 'primary' : 'ghost'}
          title={isPinned ? 'Unpin' : 'Pin to Save'}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
        >
          {isPinned ? '★' : '☆'}
        </Button>
      </div>
      
      <div className={`gen-details ${isExpanded ? '' : 'hidden'}`}>
        <div className="gen-tags-grid">
          {sortedTags.map(t => {
            const tagData = tags[t.id];
            const tagName = tagData ? tagData.name : t.id;
            const isFixed = lockedTagIds.has(t.id);
            return (
              <span 
                key={t.id} 
                className={`gen-tag-chip ${isFixed ? 'tag-fixed' : ''}`}
              >
                {tagName} <small>{t.category}</small>
                {onExcludeTag && !isFixed && (
                  <Button
                    size="icon"
                    variant="danger"
                    className="chip-exclude-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExcludeTag(t.id, t.category);
                    }}
                    title="Exclude this tag and regenerate"
                  >
                    ×
                  </Button>
                )}
              </span>
            );
          })}
        </div>
        <div className="gen-actions">
          {script.fromSave && (
            <span className="from-save-indicator" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              From Save
            </span>
          )}
          {onTransfer && (
            <Button size="sm" variant="primary" onClick={handleTransfer} title="Find Best Advertisers →" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ScriptCard;
