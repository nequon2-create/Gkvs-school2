import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarDays, AlertCircle, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
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

export function CalendarPage() {
    const [calendarEmbedUrl, setCalendarEmbedUrl] = useState<string | null>(null);
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New Event Form State
    const [showForm, setShowForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', type: 'holiday' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCalendarSettings();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // Auto-remove expired events from database
            await supabase
                .from('events')
                .delete()
                .lt('date', todayStr);

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let uploadedImageUrl: string | null = null;
            if (imageFile) {
                try {
                    uploadedImageUrl = await uploadFileToStorage('avatars', imageFile);
                } catch (storageErr) {
                    console.warn('Failed to upload image to Supabase Storage, using Base64 fallback:', storageErr);
                    uploadedImageUrl = await fileToBase64(imageFile);
                }
            }

            const { error } = await supabase.from('events').insert([
                {
                    title: newEvent.title,
                    description: newEvent.description,
                    date: newEvent.date,
                    type: newEvent.type,
                    images: uploadedImageUrl ? [uploadedImageUrl] : null
                }
            ]);
            if (error) throw error;

            alert('Event added successfully!');
            setShowForm(false);
            setNewEvent({ title: '', description: '', date: '', type: 'holiday' });
            setImageFile(null);
            setImagePreview(null);
            fetchEvents();
        } catch (err: any) {
            console.error('Error adding event:', err);
            alert('Failed to add event: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const fetchCalendarSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('school_settings')
                .select('calendar_embed_url')
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data?.calendar_embed_url) {
                setCalendarEmbedUrl(data.calendar_embed_url);
            }
        } catch (err: any) {
            console.error('Error fetching calendar settings:', err);
            setError('Failed to load calendar settings.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div className="calendar-page-container">
            <div className="calendar-page-header">
                <h1 className="calendar-page-title">
                    <CalendarDays className="text-primary" size={28} />
                    Events & Calendar
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-add-event-gradient"
                >
                    <Plus size={20} />
                    {showForm ? 'Cancel' : 'Add Event'}
                </button>
            </div>

            {showForm && (
                <div className="event-form-card">
                    <h2>Create New Event</h2>
                    <form onSubmit={handleAddEvent}>
                        <div className="event-form-grid">
                            <div className="event-form-group event-form-group-full">
                                <label className="event-form-label">Event Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="event-form-control"
                                    placeholder="E.g., Annual Sports Day"
                                />
                            </div>
                            <div className="event-form-group event-form-group-full">
                                <label className="event-form-label">Description (Optional)</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="event-form-control"
                                    placeholder="Provide event details here..."
                                    rows={3}
                                />
                            </div>
                            <div className="event-form-group">
                                <label className="event-form-label">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    className="event-form-control"
                                />
                            </div>
                            <div className="event-form-group">
                                <label className="event-form-label">Type</label>
                                <select
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                    className="event-form-control"
                                >
                                    <option value="holiday">Holiday</option>
                                    <option value="exam">Exam</option>
                                    <option value="sports">Sports</option>
                                    <option value="cultural">Cultural</option>
                                    <option value="meeting">Meeting</option>
                                </select>
                            </div>
                            <div className="event-form-group event-form-group-full">
                                <label className="event-form-label">Event Image (Optional)</label>
                                <div className="event-image-upload-wrapper">
                                    <span className="upload-placeholder-text">Click or drag an image here to upload</span>
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
                                    />
                                </div>
                                {imagePreview && (
                                    <div className="image-preview-container">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="image-preview-img"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="btn-remove-preview"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="event-form-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                                className="btn-cancel-event"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-save-event"
                            >
                                {submitting ? 'Saving...' : 'Save Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="calendar-layout-grid">
                <div>
                    {error ? (
                        <div style={{ padding: '16px', background: '#fee2e2', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertCircle size={20} />
                            <p>{error}</p>
                        </div>
                    ) : calendarEmbedUrl ? (
                        <div className="calendar-card" style={{ minHeight: '600px' }}>
                            <iframe
                                src={calendarEmbedUrl}
                                style={{ border: 0, width: '100%', height: '100%', minHeight: '600px' }}
                                frameBorder="0"
                                scrolling="yes"
                                title="School Calendar"
                            ></iframe>
                        </div>
                    ) : (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
                            <div style={{ background: '#f8fafc', height: '80px', width: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #f1f5f9' }}>
                                <CalendarDays size={32} style={{ color: '#94a3b8' }} />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>No Calendar Configured</h2>
                            <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                The school calendar has not been set up yet. Please go to Settings &gt; School Settings to manage the academic calendar embed URL.
                            </p>
                        </div>
                    )}
                </div>

                {/* School Events List side panel */}
                <div className="events-list-card">
                    <h2>
                        <CalendarIcon className="text-primary" size={24} />
                        Upcoming Events
                    </h2>

                    <div className="events-list-scroll">
                        {events.length === 0 ? (
                            <div className="event-empty-state">
                                <CalendarIcon size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                                <p>No upcoming events found.</p>
                            </div>
                        ) : (
                            <div>
                                {events.map((event) => (
                                    <div key={event.id} className="upcoming-event-item">
                                        {event.images && event.images.length > 0 && (
                                            <img
                                                src={event.images[0]}
                                                alt={event.title}
                                                className="event-thumbnail-img"
                                            />
                                        )}
                                        <div className="event-content-info">
                                            <div className="event-content-header">
                                                <h3 className="event-content-title" title={event.title}>{event.title}</h3>
                                                <span className={`badge-event-type ${event.type}`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="event-content-desc">
                                                    {event.description}
                                                </p>
                                            )}
                                            <div className="event-content-time">
                                                <Clock size={12} />
                                                <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
