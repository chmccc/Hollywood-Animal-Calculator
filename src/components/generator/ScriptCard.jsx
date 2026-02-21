import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { SummaryContent } from '../synergy/ScriptSummary';

function ScriptCard({ script, isPinned, onTogglePin, onNameChange, onTransfer }) {
  const { tags: tagData } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const compClass = script.stats.avgComp >= 4.0 ? 'val-high' : script.stats.avgComp >= 3.0 ? 'val-mid' : 'val-low';

  const genrePercents = useMemo(() => {
    const genres = script.tags.filter(t => t.category === 'Genre');
    if (genres.length <= 1) return {};
    const percents = {};
    genres.forEach(g => { percents[g.id] = Math.round((g.percent || 1) * 100); });
    return percents;
  }, [script.tags]);

  const displayName = useMemo(() => {
    if (script.name) return script.name;
    const genres = script.tags
      .filter(t => t.category === 'Genre')
      .sort((a, b) => (b.percent || 1) - (a.percent || 1));
    if (genres.length === 0) return 'Script';
    return genres.map(g => tagData[g.id]?.name || g.id).join(' / ');
  }, [script.name, script.tags, tagData]);

  const handleHeaderClick = (e) => {
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
              <span className="script-name-display">{displayName.toUpperCase()}</span>
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
        {script.fromSave && script.phaseName ? (
          <span className="production-phase-badge">{script.phaseName}</span>
        ) : isPinned && (
          <span className="production-phase-badge user-pinned">User Pinned</span>
        )}
        <Button
          size="icon"
          variant="primary"
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
        <SummaryContent selectedTags={script.tags} genrePercents={genrePercents} />
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
