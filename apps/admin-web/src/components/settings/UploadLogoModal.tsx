import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface UploadLogoModalProps {
    onClose: () => void;
    onSuccess: (url: string) => void;
}

export function UploadLogoModal({ onClose, onSuccess }: UploadLogoModalProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('school-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('school-assets')
                .getPublicUrl(fileName);

            const photoUrl = urlData.publicUrl;

            // Update school_settings record
            const { data: existing } = await supabase
                .from('school_settings')
                .select('id')
                .limit(1)
                .single();

            if (existing) {
                await supabase.from('school_settings').update({ logo_url: photoUrl }).eq('id', existing.id);
            } else {
                await supabase.from('school_settings').insert([{ logo_url: photoUrl }]);
            }

            onSuccess(photoUrl);
        } catch (err: any) {
            console.error('Error uploading logo:', err);
            alert(`Failed to upload logo: ${err.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>🖼️</span> Upload Logo
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={uploading}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Preview Area */}
                    <div className="flex justify-center">
                        <div
                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 font-medium">Click to select</span>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Recommended size: 256x256px.
                        <br />Max file size: 2MB.
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleFileSelect}
                    />

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading || !file}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Save Logo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
