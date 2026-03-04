import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarDays, AlertCircle, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface DBEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: string;
}

export function CalendarPage() {
    const [calendarEmbedUrl, setCalendarEmbedUrl] = useState<string | null>(null);
    const [events, setEvents] = useState<DBEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New Event Form State
    const [showForm, setShowForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', type: 'holiday' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCalendarSettings();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
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

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from('events').insert([
                { title: newEvent.title, description: newEvent.description, date: newEvent.date, type: newEvent.type }
            ]);
            if (error) throw error;

            alert('Event added successfully!');
            setShowForm(false);
            setNewEvent({ title: '', description: '', date: '', type: 'holiday' });
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
            <div className="p-8 flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                    <CalendarDays className="text-primary" size={28} />
                    Events & Calendar
                </h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Plus size={20} />
                    {showForm ? 'Cancel' : 'Add Event'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                    <h2 className="text-lg font-bold mb-4">Create New Event</h2>
                    <form onSubmit={handleAddEvent} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                            <input
                                type="text"
                                required
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                placeholder="E.g., Annual Sports Day"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            >
                                <option value="holiday">Holiday</option>
                                <option value="exam">Exam</option>
                                <option value="sports">Sports</option>
                                <option value="cultural">Cultural</option>
                                <option value="meeting">Meeting</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">

                    {error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
                            <AlertCircle size={20} />
                            <p>{error}</p>
                        </div>
                    ) : calendarEmbedUrl ? (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ minHeight: '600px' }}>
                            <iframe
                                src={calendarEmbedUrl}
                                style={{ border: 0, width: '100%', height: '100%', minHeight: '600px' }}
                                frameBorder="0"
                                scrolling="yes"
                                title="School Calendar"
                            ></iframe>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <CalendarDays size={32} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No Calendar Configured</h2>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                The school calendar has not been set up yet. Please go to Settings &gt; School Settings to manage the academic calendar embed URL.
                            </p>
                        </div>
                    )}
                </div>

                {/* School Events List side panel */}
                <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col h-[600px]">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CalendarIcon className="text-primary" size={24} />
                        Upcoming Events
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {events.length === 0 ? (
                            <div className="text-center py-10">
                                <CalendarIcon size={40} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No events found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="border border-gray-100 bg-gray-50 rounded-lg p-4 hover:border-primary/30 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                                                {event.type}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock size={14} />
                                            <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
