import LayoutCard from './LayoutCard';
import SearchBar from './SearchBar';

/**
 * QuickSearchCard - Reusable search card component used across tabs
 * 
 * Props:
 * - onSelect: Callback when a tag is selected from search
 * - placeholder: Optional custom placeholder text
 */
function QuickSearchCard({ onSelect, placeholder = "Type to find a tag (e.g., 'Action', 'Cowboy')..." }) {
  return (
    <LayoutCard 
      className="search-card"
      title="Quick Search"
      subtitle="Type to find tags by name or browse categories below."
    >
      <SearchBar
        onSelect={onSelect}
        placeholder={placeholder}
      />
    </LayoutCard>
  );
}

export default QuickSearchCard;
