import { useApp } from '../../context/AppContext';
import LayoutCard from '../common/LayoutCard';

// Summary row component for displaying category with tag chips
function SummaryRow({ label, children }) {
  return (
    <div className="script-summary-row">
      <span className="script-summary-label">{label}</span>
      <div className="script-summary-tags">
        {children}
      </div>
    </div>
  );
}

// Tag chip for summary display
function SummaryTag({ name, percent, category }) {
  const categoryClass = category ? `cat-${category.toLowerCase().replace(/[& ]/g, '-')}` : '';
  return (
    <span className={`script-summary-tag ${categoryClass}`}>
      {name}{percent !== undefined && `: ${percent}%`}
    </span>
  );
}

function SummaryContent({ selectedTags = [], genrePercents = {} }) {
  const { tags: tagData } = useApp();

  if (selectedTags.length === 0 || !tagData) {
    return null;
  }

  const sortByName = (tags) => [...tags].sort((a, b) => {
    const nameA = tagData[a.id]?.name || a.id;
    const nameB = tagData[b.id]?.name || b.id;
    return nameA.localeCompare(nameB);
  });

  const genres = sortByName(selectedTags.filter(t => t.category === 'Genre' && t.id));
  const setting = selectedTags.find(t => t.category === 'Setting' && t.id);
  const protagonist = selectedTags.find(t => t.category === 'Protagonist' && t.id);
  const antagonist = selectedTags.find(t => t.category === 'Antagonist' && t.id);
  const supporting = sortByName(selectedTags.filter(t => t.category === 'Supporting Character' && t.id));
  const themes = sortByName(selectedTags.filter(t => t.category === 'Theme & Event' && t.id));
  const finale = selectedTags.find(t => t.category === 'Finale' && t.id);

  return (
    <div className="script-summary">
      {genres.length > 0 && (
        <SummaryRow label="Genres">
          {genres.map(t => (
            <SummaryTag 
              key={t.id} 
              name={tagData[t.id]?.name || t.id}
              percent={genres.length > 1 ? genrePercents[t.id] : undefined}
              category="genre"
            />
          ))}
        </SummaryRow>
      )}
      {setting && (
        <SummaryRow label="Setting">
          <SummaryTag name={tagData[setting.id]?.name || setting.id} category="setting" />
        </SummaryRow>
      )}
      {protagonist && (
        <SummaryRow label="Protagonist">
          <SummaryTag name={tagData[protagonist.id]?.name || protagonist.id} category="protagonist" />
        </SummaryRow>
      )}
      {antagonist && (
        <SummaryRow label="Antagonist">
          <SummaryTag name={tagData[antagonist.id]?.name || antagonist.id} category="antagonist" />
        </SummaryRow>
      )}
      {supporting.length > 0 && (
        <SummaryRow label="Supporting">
          {supporting.map(t => (
            <SummaryTag key={t.id} name={tagData[t.id]?.name || t.id} category="supporting" />
          ))}
        </SummaryRow>
      )}
      {themes.length > 0 && (
        <SummaryRow label="Themes and Events">
          {themes.map(t => (
            <SummaryTag key={t.id} name={tagData[t.id]?.name || t.id} category="theme" />
          ))}
        </SummaryRow>
      )}
      {finale && (
        <SummaryRow label="Finale">
          <SummaryTag name={tagData[finale.id]?.name || finale.id} category="finale" />
        </SummaryRow>
      )}
    </div>
  );
}

function ScriptSummary({ selectedTags = [], genrePercents = {} }) {
  return (
    <LayoutCard 
      className="result-card"
      title="Summary"
    >
      <SummaryContent selectedTags={selectedTags} genrePercents={genrePercents} />
    </LayoutCard>
  );
}

export default ScriptSummary;
export { SummaryContent };
