import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
    CalendarDays, 
    AlertCircle, 
    Plus, 
    Calendar as CalendarIcon, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Trash2, 
    FileText 
} from 'lucide-react';
import { uploadFileToStorage } from '../utils/storage';
import './CalendarPage.css';

interface DBEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: string;
    images?: string[] | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
    holiday: 'badge-holiday',
    exam: 'badge-exam',
    sports: 'badge-sports',
    cultural: 'badge-cultural',
    meeting: 'badge-meeting',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Slide-out Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<DBEvent | null>(null);

    // Form inputs state
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventType, setEventType] = useState('holiday');
    const [eventDateStr, setEventDateStr] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err: any) {
            console.error('Error fetching events:', err);
            setError(err.message || 'Failed to load events.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleOpenCreateDrawer = (date: Date) => {
        setSelectedEvent(null);
        setEventTitle('');
        setEventDescription('');
        setEventType('holiday');
        setEventDateStr(formatDateString(date));
        setImageFile(null);
        setImagePreview(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEditDrawer = (event: DBEvent, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening create dialog for the cell
        setSelectedEvent(event);
        setEventTitle(event.title);
        setEventDescription(event.description || '');
        setEventType(event.type);
        setEventDateStr(event.date);
        setImagePreview(event.images?.[0] || null);
        setImageFile(null);
        setIsDrawerOpen(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventTitle.trim() || !eventDateStr) return;

        setSubmitting(true);
        try {
            let uploadedImageUrl = imagePreview;

            if (imageFile) {
                try {
                    uploadedImageUrl = await uploadFileToStorage('avatars', imageFile);
                } catch (storageErr) {
                    console.warn('Failed to upload image to Supabase Storage, fallback to Base64:', storageErr);
                    uploadedImageUrl = await fileToBase64(imageFile);
                }
            }

            const eventData = {
                title: eventTitle.trim(),
                description: eventDescription.trim(),
                date: eventDateStr,
                type: eventType,
                images: uploadedImageUrl ? [uploadedImageUrl] : null
            };

            if (selectedEvent) {
                // Update
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', selectedEvent.id);

                if (error) throw error;
                alert('Event updated successfully!');
            } else {
                // Create
                const { error } = await supabase
                    .from('events')
                    .insert([eventData]);

                if (error) throw error;
                alert('Event created successfully!');
            }

            setIsDrawerOpen(false);
            fetchEvents();
        } catch (err: any) {
            console.error('Error saving event:', err);
            alert('Failed to save event: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        if (!window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', selectedEvent.id);

            if (error) throw error;
            alert('Event deleted successfully!');
            setIsDrawerOpen(false);
            fetchEvents();
        } catch (err: any) {
            console.error('Error deleting event:', err);
            alert('Failed to delete event: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate calendar grid days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Prev month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, daysInPrevMonth - i);
        cells.push({ date: d, isCurrentMonth: false, key: `prev-${daysInPrevMonth - i}` });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        cells.push({ date: d, isCurrentMonth: true, key: `curr-${i}` });
    }

    // Next month days
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
        const d = new Date(year, month + 1, i);
        cells.push({ date: d, isCurrentMonth: false, key: `next-${i}` });
    }

    const currentMonthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const todayStr = formatDateString(new Date());

    return (
        <div className="calendar-page-container">
            {/* Header controls */}
            <div className="calendar-page-header">
                <h1 className="calendar-page-title">
                    <CalendarDays className="text-primary" size={28} />
                    Events Calendar
                </h1>
                <div className="calendar-controls">
                    <button onClick={handleToday} className="btn-today">Today</button>
                    <div className="nav-arrows">
                        <button onClick={handlePrevMonth} className="btn-nav-arrow">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="month-indicator">{currentMonthLabel}</span>
                        <button onClick={handleNextMonth} className="btn-nav-arrow">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => handleOpenCreateDrawer(new Date())}
                        className="btn-add-event-gradient"
                    >
                        <Plus size={20} />
                        Add Event
                    </button>
                </div>
            </div>

            {error && (
                <div className="calendar-error-banner">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Calendar Main Layout */}
            <div className="calendar-grid-wrapper">
                {/* Weekday headers */}
                <div className="weekday-headers-row">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="weekday-header-cell">{day}</div>
                    ))}
                </div>

                {/* Grid cells */}
                {loading ? (
                    <div className="calendar-spinner-wrapper">
                        <div className="spinner"></div>
                        <p>Loading calendar...</p>
                    </div>
                ) : (
                    <div className="calendar-grid-body">
                        {cells.map(cell => {
                            const dateStr = formatDateString(cell.date);
                            const isToday = dateStr === todayStr;
                            const dayEvents = events.filter(e => e.date === dateStr);

                            return (
                                <div
                                    key={cell.key}
                                    className={`calendar-day-cell ${cell.isCurrentMonth ? 'current-month' : 'adjacent-month'} ${isToday ? 'today-cell' : ''}`}
                                    onClick={() => handleOpenCreateDrawer(cell.date)}
                                >
                                    <div className="day-number-row">
                                        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>
                                            {cell.date.getDate()}
                                        </span>
                                    </div>
                                    <div className="day-events-container">
                                        {dayEvents.map(event => {
                                            const badgeClass = EVENT_TYPE_COLORS[event.type] || 'badge-other';
                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => handleOpenEditDrawer(event, e)}
                                                    className={`event-pill-item ${badgeClass}`}
                                                    title={event.title}
                                                >
                                                    <span className="event-pill-dot"></span>
                                                    <span className="event-pill-title">{event.title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notion-style Slide-out Drawer Overlay */}
            {isDrawerOpen && (
                <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
                    <div className="drawer-container" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <h2 className="drawer-title">
                                {selectedEvent ? 'Edit Event Details' : 'Create New Event'}
                            </h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="drawer-close-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="drawer-body">
                            <div className="drawer-form-group">
                                <label className="drawer-label">Event Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={eventTitle}
                                    onChange={e => setEventTitle(e.target.value)}
                                    placeholder="E.g., Annual Sports Day Meet"
                                    className="drawer-input"
                                />
                            </div>

                            <div className="drawer-form-group">
                                <label className="drawer-label">Description</label>
                                <textarea
                                    value={eventDescription}
                                    onChange={e => setEventDescription(e.target.value)}
                                    placeholder="Add instructions, location, or details..."
                                    rows={4}
                                    className="drawer-input textarea"
                                />
                            </div>

                            <div className="drawer-form-row">
                                <div className="drawer-form-group half">
                                    <label className="drawer-label">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={eventDateStr}
                                        onChange={e => setEventDateStr(e.target.value)}
                                        className="drawer-input"
                                    />
                                </div>
                                <div className="drawer-form-group half">
                                    <label className="drawer-label">Event Type *</label>
                                    <select
                                        value={eventType}
                                        onChange={e => setEventType(e.target.value)}
                                        className="drawer-input select"
                                    >
                                        <option value="holiday">Holiday</option>
                                        <option value="exam">Exam</option>
                                        <option value="sports">Sports</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="meeting">Meeting</option>
                                    </select>
                                </div>
                            </div>

                            <div className="drawer-form-group">
                                <label className="drawer-label">Event Banner / Photo (Optional)</label>
                                <div className="drawer-upload-box">
                                    <p className="upload-box-text">Click or drop a banner image to upload</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => {
                                            const file = e.target.files?.[0] || null;
                                            setImageFile(file);
                                            if (file) {
                                                setImagePreview(URL.createObjectURL(file));
                                            } else {
                                                setImagePreview(null);
                                            }
                                        }}
                                        className="drawer-file-input"
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="drawer-preview-box">
                                        <img src={imagePreview} alt="Event Preview" className="drawer-preview-img" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="drawer-btn-remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="drawer-actions">
                                {selectedEvent && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteEvent}
                                        className="btn-drawer-delete"
                                        disabled={submitting}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="btn-drawer-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-drawer-save"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
