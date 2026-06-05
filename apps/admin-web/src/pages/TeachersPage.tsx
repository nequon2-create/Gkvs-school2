import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeachers } from '../hooks/useTeachers';
import { BackButton } from '../components/common';
import { SearchBar } from '../components/features/lists/SearchBar';
import { TeacherCard } from '../components/features/lists/TeacherCard';
import { EmptyState } from '../components/features/lists/EmptyState';
import type { TeacherListItem } from '../types/list.types';
import { supabase } from '../lib/supabase';
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
    const [ratings, setRatings] = useState<Record<string, { total: number; count: number }>>({});

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const currentMonth = new Date().toISOString().substring(0, 7);
                const { data, error: ratingsError } = await supabase
                    .from('teacher_ratings')
                    .select('teacher_id, rating')
                    .eq('rating_month', currentMonth);

                if (ratingsError) throw ratingsError;

                const ratingsMap: Record<string, { total: number; count: number }> = {};
                if (data) {
                    data.forEach((item: any) => {
                        if (!ratingsMap[item.teacher_id]) {
                            ratingsMap[item.teacher_id] = { total: 0, count: 0 };
                        }
                        ratingsMap[item.teacher_id].total += item.rating;
                        ratingsMap[item.teacher_id].count += 1;
                    });
                }
                setRatings(ratingsMap);
            } catch (err) {
                console.error('Error fetching teacher ratings:', err);
            }
        };

        fetchRatings();
    }, [teachers]);

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

    const leaderboardData = [...teachers]
        .map(teacher => {
            const stats = ratings[teacher.id];
            const avg = stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0;
            const count = stats ? stats.count : 0;
            return {
                ...teacher,
                averageRating: avg,
                totalReviews: count,
            };
        })
        .sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating;
            }
            if (b.totalReviews !== a.totalReviews) {
                return b.totalReviews - a.totalReviews;
            }
            return a.full_name.localeCompare(b.full_name);
        });

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

            <div className="teachers-layout-container">
                <div className="teachers-main-content">
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
                            {teachers.map((teacher) => {
                                const ratingStats = ratings[teacher.id];
                                const avg = ratingStats ? Math.round((ratingStats.total / ratingStats.count) * 10) / 10 : undefined;
                                const count = ratingStats ? ratingStats.count : 0;
                                return (
                                    <TeacherCard
                                        key={teacher.id}
                                        teacher={teacher}
                                        rating={avg}
                                        reviewsCount={count}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="teachers-leaderboard-sidebar">
                    <div className="leaderboard-card">
                        <div className="leaderboard-card-header">
                            <div className="leaderboard-title-group">
                                <h2 className="leaderboard-title">Monthly Leaderboard</h2>
                                <p className="leaderboard-subtitle">Top rated teachers this month</p>
                            </div>
                            <span className="leaderboard-month-badge">
                                {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="leaderboard-list">
                            {leaderboardData.length === 0 ? (
                                <div className="leaderboard-empty">
                                    <p>No ratings data available.</p>
                                </div>
                            ) : (
                                leaderboardData.map((item, index) => {
                                    const rank = index + 1;
                                    const hasRating = item.totalReviews > 0;
                                    const percentage = hasRating ? (item.averageRating / 5) * 100 : 0;

                                    return (
                                        <div key={item.id} className={`leaderboard-item rank-${rank}`}>
                                            <div className="leaderboard-rank-col">
                                                {rank <= 3 ? (
                                                    <span className={`rank-medal rank-medal-${rank}`}>
                                                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                                    </span>
                                                ) : (
                                                    <span className="rank-number">{rank}</span>
                                                )}
                                            </div>

                                            <div className="leaderboard-avatar-col">
                                                {item.photo_url ? (
                                                    <img className="leaderboard-avatar" src={item.photo_url} alt={item.full_name} />
                                                ) : (
                                                    <div className="leaderboard-avatar-placeholder">
                                                        {item.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="leaderboard-info-col">
                                                <div className="leaderboard-info-header">
                                                    <span className="leaderboard-name">{item.full_name}</span>
                                                    {hasRating ? (
                                                        <div className="leaderboard-rating">
                                                            <span className="star">★</span>
                                                            <span className="avg">{item.averageRating.toFixed(1)}</span>
                                                            <span className="count">({item.totalReviews})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="no-ratings-text">No ratings</span>
                                                    )}
                                                </div>

                                                <div className="leaderboard-progress-bg">
                                                    <div
                                                        className="leaderboard-progress-fill"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
