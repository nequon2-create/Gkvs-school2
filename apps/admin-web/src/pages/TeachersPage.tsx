import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeachers } from '../hooks/useTeachers';
import { BackButton } from '../components/common';
import { SearchBar } from '../components/features/lists/SearchBar';
import { TeacherCard } from '../components/features/lists/TeacherCard';
import { EmptyState } from '../components/features/lists/EmptyState';
import type { TeacherListItem } from '../types/list.types';
import './TeachersPage.css';

export function TeachersPage() {
    const navigate = useNavigate();
    const {
        teachers,
        loading,
        error,
        searchTeachers,
        deleteTeacher,
    } = useTeachers();

    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        searchTeachers(query);
    };

    const handleView = (teacher: TeacherListItem) => {
        navigate(`/teachers/${teacher.id}`);
    };

    const handleEdit = (teacher: TeacherListItem) => {
        console.log('Edit teacher:', teacher);
        alert(`Edit profile for ${teacher.full_name} (Coming soon!)`);
    };

    const handleDelete = async (teacher: TeacherListItem) => {
        const success = await deleteTeacher(teacher.id);
        if (success) {
            alert(`${teacher.full_name} deleted successfully`);
        }
    };

    const handleCreateNew = () => {
        navigate('/create-profile');
    };

    return (
        <div className="teachers-page">
            <div className="page-header">
                <div>
                    <BackButton to="/dashboard" />
                    <h1 className="page-title">Teachers</h1>
                    <p className="page-subtitle">
                        {loading ? 'Loading...' : `${teachers.length} ${teachers.length === 1 ? 'teacher' : 'teachers'}`}
                    </p>
                </div>
                <button className="create-new-btn" onClick={handleCreateNew}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add Teacher
                </button>
            </div>

            <div className="page-controls">
                <SearchBar
                    placeholder="Search by name, registration, or email..."
                    onSearch={handleSearch}
                />
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
                    <p>Loading teachers...</p>
                </div>
            ) : teachers.length === 0 ? (
                <EmptyState
                    icon={
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <path d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M32 22V32M32 42H32.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    }
                    title={searchQuery ? "No teachers found" : "No teachers yet"}
                    description={
                        searchQuery
                            ? `No teachers match "${searchQuery}". Try a different search term.`
                            : "Get started by adding your first teacher profile."
                    }
                    action={{
                        label: searchQuery ? "Clear Search" : "Add Teacher",
                        onClick: searchQuery ? () => handleSearch('') : handleCreateNew,
                    }}
                />
            ) : (
                <div className="teachers-grid">
                    {teachers.map((teacher) => (
                        <TeacherCard
                            key={teacher.id}
                            teacher={teacher}
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
