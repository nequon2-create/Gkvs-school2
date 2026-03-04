import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Save, X } from 'lucide-react';

interface ManageCalendarModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function ManageCalendarModal({ onClose, onSuccess }: ManageCalendarModalProps) {
    const [calendarEmbedUrl, setCalendarEmbedUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCalendarSettings();
    }, []);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            // First check if a record exists
            const { data: existing, error: checkError } = await supabase
                .from('school_settings')
                .select('id')
                .limit(1)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;

            if (existing) {
                // Update
                const { error: updateError } = await supabase
                    .from('school_settings')
                    .update({ calendar_embed_url: calendarEmbedUrl })
                    .eq('id', existing.id);

                if (updateError) throw updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('school_settings')
                    .insert([{ calendar_embed_url: calendarEmbedUrl }]);

                if (insertError) throw insertError;
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error saving calendar settings:', err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="text-primary" />
                        Manage Academic Calendar
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Google Calendar Public Embed URL
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                            Paste the iframe `src` URL from your Google Calendar settings (Settings &gt; Integrate calendar &gt; Public URL to this calendar). It should be a public calendar.
                        </p>
                        {loading ? (
                            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                        ) : (
                            <input
                                type="url"
                                required
                                value={calendarEmbedUrl}
                                onChange={(e) => setCalendarEmbedUrl(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="https://calendar.google.com/calendar/embed?src=..."
                            />
                        )}
                    </div>

                    {calendarEmbedUrl && !loading && (
                        <div className="mb-6 border rounded-lg overflow-hidden bg-gray-50 p-2">
                            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Preview</p>
                            <iframe
                                src={calendarEmbedUrl}
                                style={{ border: 0, width: '100%', height: '300px' }}
                                frameBorder="0"
                                scrolling="no"
                                title="Calendar Preview"
                                className="bg-white rounded border"
                            ></iframe>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
