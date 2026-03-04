import { useAcademicYears } from '../../../hooks/useAcademicYears';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import type { FilterOptions } from '../../../types/list.types';
import './StudentFilters.css';

interface Class {
    id: string;
    class_name: string;
    section?: string | null;
}

interface StudentFiltersProps {
    onFilterChange: (filters: FilterOptions) => void;
}

export function StudentFilters({ onFilterChange }: StudentFiltersProps) {
    const { years: academicYears } = useAcademicYears();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');
    const initializedRef = useRef(false);

    useEffect(() => {
        if (academicYears.length > 0 && !initializedRef.current) {
            const currentYear = academicYears.find(y => y.is_current);
            if (currentYear) {
                setSelectedYear(currentYear.id);
            }
            initializedRef.current = true;
        }
    }, [academicYears]);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        const filters: FilterOptions = {};

        if (selectedClass) filters.classId = selectedClass;
        if (selectedYear) filters.academicYearId = selectedYear;
        if (selectedGender) filters.gender = selectedGender;
        if (selectedStatus) filters.isActive = selectedStatus === 'active';

        onFilterChange(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear, selectedGender, selectedStatus]); // Removed onFilterChange to prevent infinite loop

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name, section')
            .order('class_name', { ascending: true }); // ✅ Simple ordering by name

        if (data) setClasses(data);
    };

    const handleReset = () => {
        setSelectedClass('');
        const currentYear = academicYears.find(y => y.is_current);
        setSelectedYear(currentYear ? currentYear.id : '');
        setSelectedGender('');
        setSelectedStatus('');
    };

    const hasActiveFilters = selectedClass || selectedGender || selectedStatus || (selectedYear !== academicYears.find(y => y.is_current)?.id);

    return (
        <div className="student-filters">
            <select
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
            >
                <option value="">All Classes</option>
                {(classes || []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                        {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                    </option>
                ))}
            </select>

            <select
                className="filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
            >
                <option value="">All Years</option>
                {(academicYears || []).map((year) => (
                    <option key={year.id} value={year.id}>
                        {year.year_name}
                    </option>
                ))}
            </select>

            <select
                className="filter-select"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value as any)}
            >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>

            <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>

            {hasActiveFilters && (
                <button className="reset-filters-btn" onClick={handleReset}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Reset
                </button>
            )}
        </div>
    );
}
