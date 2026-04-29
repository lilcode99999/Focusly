import React, { useEffect, useRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  focusSignal?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  focusSignal = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSignal > 0) {
      inputRef.current?.focus();
    }
  }, [focusSignal]);

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Search...'}
        />
        {value && (
          <button
            className="search-clear"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
