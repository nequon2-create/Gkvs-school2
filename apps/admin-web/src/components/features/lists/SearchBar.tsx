import { useState, useEffect } from 'react';
import './SearchBar.css';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
}

export function SearchBar({ placeholder = "Search...", onSearch, debounceMs = 300 }: SearchBarProps) {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, onSearch, debounceMs]);

    return (
        <div className="search-bar">
            <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
            >
                <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
                <button
                    className="clear-button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M12 4L4 12M4 4l8 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
