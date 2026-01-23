import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { buildSearchIndex, searchTags } from '../../utils/tagHelpers';

function SearchBar({ onSelect, placeholder = "Type to find a tag..." }) {
  const { tags } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);

  const searchIndex = buildSearchIndex(tags);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const matches = searchTags(searchIndex, query);
    setResults(matches);
    setShowResults(matches.length > 0);
  }, [query, searchIndex]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelect = (tag) => {
    onSelect(tag);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {showResults && (
        <div className="search-results">
          {results.map(match => (
            <div
              key={match.id}
              className="search-item"
              onClick={() => handleSelect(match)}
            >
              <strong>{match.name}</strong> <small>{match.category}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
