import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { AcademicYearStatus } from '../../../types/academic-years.types';
import './SearchAndFilter.css';

export interface SearchAndFilterProps {
    onSearchChange: (search: string) => void;
    onFilterChange: (filter: AcademicYearStatus) => void;
    activeFilter: AcademicYearStatus;
}

export function SearchAndFilter({ onSearchChange, onFilterChange, activeFilter }: SearchAndFilterProps) {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, onSearchChange]);

    const filters: { value: AcademicYearStatus; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'current', label: 'Current' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'past', label: 'Past' },
    ];

    return (
        <div className="search-and-filter">
            <div className="search-box">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search academic years..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        className="clear-search-btn"
                        onClick={() => setSearchTerm('')}
                        title="Clear search"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="filter-buttons">
                <Filter size={18} className="filter-icon" />
                {filters.map((filter) => (
                    <button
                        key={filter.value}
                        className={`filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
                        onClick={() => onFilterChange(filter.value)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
