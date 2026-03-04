import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { BackButton } from '../components/common';
import { SearchBar } from '../components/features/lists/SearchBar';
import { StudentFilters } from '../components/features/lists/StudentFilters';
import { StudentCard } from '../components/features/lists/StudentCard';
import { EmptyState } from '../components/features/lists/EmptyState';
import type { StudentListItem, FilterOptions } from '../types/list.types';
import './StudentsPage.css';

export function StudentsPage() {
    const navigate = useNavigate();
    const {
        students,
        loading,
        error,
        searchStudents,
        filterStudents,
        deleteStudent,
    } = useStudents();

    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchStudents(query);
    };

    const handleFilterChange = (filters: FilterOptions) => {
        filterStudents(filters);
    };

    const handleView = (student: StudentListItem) => {
        navigate(`/students/${student.id}`);
    };

    const handleEdit = (student: StudentListItem) => {
        // TODO: Navigate to edit student page
        console.log('Edit student:', student);
        alert(`Edit profile for ${student.full_name} (Coming soon!)`);
    };

    const handleDelete = async (student: StudentListItem) => {
        const success = await deleteStudent(student.id);
        if (success) {
            alert(`${student.full_name} deleted successfully`);
        }
    };

    const handleCreateNew = () => {
        navigate('/create-profile');
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <div>
                    <BackButton to="/dashboard" />
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">
                        {loading ? 'Loading...' : `${students.length} ${students.length === 1 ? 'student' : 'students'}`}
                    </p>
                </div>
                <button className="create-new-btn" onClick={handleCreateNew}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add Student
                </button>
            </div>

            <div className="page-controls">
                <SearchBar
                    placeholder="Search by name or registration number..."
                    onSearch={handleSearch}
                />
                <StudentFilters onFilterChange={handleFilterChange} />
            </div>

            {error && (
                <div className="error-banner">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading students...</p>
                </div>
            ) : students.length === 0 ? (
                <EmptyState
                    icon={
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <path d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M32 22V32M32 42H32.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    }
                    title={searchQuery ? "No students found" : "No students yet"}
                    description={
                        searchQuery
                            ? `No students match "${searchQuery}". Try a different search term.`
                            : "Get started by adding your first student profile."
                    }
                    action={{
                        label: searchQuery ? "Clear Search" : "Add Student",
                        onClick: searchQuery ? () => handleSearch('') : handleCreateNew,
                    }}
                />
            ) : (
                <div className="students-grid">
                    {students.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
