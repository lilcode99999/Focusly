import React from 'react';
import './FilterPanel.css';

interface FilterPanelProps {
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  allTags,
  selectedTags,
  onTagToggle,
  onClearFilters,
}) => {
  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <span className="filter-title">Filter by tags</span>
        {selectedTags.length > 0 && (
          <button className="clear-filters" onClick={onClearFilters}>
            Clear all
          </button>
        )}
      </div>
      <div className="tag-list">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`tag-filter ${selectedTags.includes(tag) ? 'selected' : ''}`}
            onClick={() => onTagToggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;