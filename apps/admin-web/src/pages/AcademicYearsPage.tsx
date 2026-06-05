import { useState, useMemo } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { BackButton } from '../components/common';
import {
    AcademicYearsList,
    AcademicYearForm,
    SearchAndFilter,
} from '../components/features/academic-years';
import { useAcademicYears } from '../hooks/useAcademicYears';
import type { AcademicYear, CreateAcademicYearInput, AcademicYearStatus } from '../types/academic-years.types';
import { getYearStatus } from '../utils/academicYearHelpers';
import './AcademicYearsPage.css';

export function AcademicYearsPage() {
    const { years, loading, error, createYear, updateYear, deleteYear, setCurrentYear } = useAcademicYears();
    const [showForm, setShowForm] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<AcademicYearStatus>('all');
    const [formLoading, setFormLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<AcademicYear | null>(null);

    // Filter and search years
    const filteredYears = useMemo(() => {
        return years.filter((year) => {
            // Search filter
            const matchesSearch = year.year_name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Status filter
            if (filterStatus === 'all') return true;
            const status = getYearStatus(year);
            return status === filterStatus;
        });
    }, [years, searchTerm, filterStatus]);

    const handleCreateOrUpdate = async (data: CreateAcademicYearInput) => {
        setFormLoading(true);

        try {
            let result;
            if (editingYear) {
                result = await updateYear({ id: editingYear.id, ...data });
            } else {
                result = await createYear(data);
            }

            if (result.success) {
                setShowForm(false);
                setEditingYear(undefined);
            } else {
                alert(result.error || 'Operation failed');
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (year: AcademicYear) => {
        setEditingYear(year);
        setShowForm(true);
    };

    const handleDelete = async (year: AcademicYear) => {
        if (year.is_current) {
            alert('Cannot delete the current academic year');
            return;
        }
        setDeleteConfirm(year);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        const result = await deleteYear(deleteConfirm.id);
        if (!result.success) {
            alert(result.error || 'Failed to delete academic year');
        }
        setDeleteConfirm(null);
    };

    const handleSetCurrent = async (year: AcademicYear) => {
        const result = await setCurrentYear(year.id);
        if (!result.success) {
            alert(result.error || 'Failed to set current year');
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingYear(undefined);
    };

    return (
        <div className="academic-years-page">
            {/* Header */}
            <header className="page-header animate-fade-in">
                <div>
                    <BackButton to="/dashboard" />
                    <h1 className="page-title">Academic Years</h1>
                    <p className="page-subtitle">Manage school academic years and sessions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={20} />
                    <span>Add New Year</span>
                </button>
            </header>

            {/* Error State */}
            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Search and Filter */}
            {!loading && years.length > 0 && (
                <SearchAndFilter
                    onSearchChange={setSearchTerm}
                    onFilterChange={setFilterStatus}
                    activeFilter={filterStatus}
                />
            )}

            {/* Years List */}
            <AcademicYearsList
                years={filteredYears}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetCurrent={handleSetCurrent}
            />

            {/* Form Modal */}
            {showForm && (
                <AcademicYearForm
                    year={editingYear}
                    onSubmit={handleCreateOrUpdate}
                    onCancel={handleCloseForm}
                    loading={formLoading}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="confirm-dialog animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <h3 className="confirm-title">Delete Academic Year?</h3>
                        <p className="confirm-message">
                            Are you sure you want to delete <strong>{deleteConfirm.year_name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="confirm-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
