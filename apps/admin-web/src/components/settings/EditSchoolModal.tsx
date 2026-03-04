import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface EditSchoolModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function EditSchoolModal({ onClose, onSuccess }: EditSchoolModalProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchoolSettings();
    }, []);

    const fetchSchoolSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('school_settings')
                .select('*')
                .limit(1)
                .single();

            if (!error && data) {
                setName(data.name || '');
                setAddress(data.address || '');
                setPhone(data.phone || '');
                setEmail(data.email || '');
            }
        } catch (err) {
            console.error('Error fetching school settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Check if a row exists
            const { data: existing } = await supabase
                .from('school_settings')
                .select('id')
                .limit(1)
                .single();

            const payload = { name, address, phone, email, updated_at: new Date().toISOString() };

            if (existing) {
                await supabase.from('school_settings').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('school_settings').insert([payload]);
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving school settings:', err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>🏫</span> Edit School Information
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            School Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="My School"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                            rows={3}
                            placeholder="123 School Street..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="contact@school.com"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
