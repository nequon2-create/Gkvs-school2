import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface PhotoUploadProps {
    currentPhoto?: string;
    onPhotoChange: (photoUrl: string) => void;
    bucketName: 'profiles' | 'student-photos' | 'teacher-photos' | 'student-gallery' | 'teacher-gallery' | 'avatars';
    label?: string;
}

export function PhotoUpload({
    currentPhoto,
    onPhotoChange,
    bucketName,
    label = 'Profile Photo',
}: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentPhoto || '');

    const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return; // User cancelled selection
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) {
                // Fallback to 'avatars' if specific bucket fails (handling potential missing buckets)
                if (bucketName !== 'avatars') {
                    console.warn(`Upload to ${bucketName} failed, trying 'avatars'...`, uploadError);
                    const { error: fallbackError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (fallbackError) throw fallbackError;

                    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    setPreview(data.publicUrl);
                    onPhotoChange(data.publicUrl);
                    return;
                }
                throw uploadError;
            }

            // Get public URL
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            setPreview(data.publicUrl);
            onPhotoChange(data.publicUrl);
        } catch (error: any) {
            alert('Error uploading photo: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ marginBottom: '24px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#1D1D1F',
                    marginBottom: '12px',
                }}
            >
                {label}
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Preview */}
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: preview
                            ? `url(${preview}) center/cover`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: '2px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '48px',
                        fontWeight: '700',
                        overflow: 'hidden'
                    }}
                >
                    {!preview && '?'}
                </div>

                {/* Upload Button */}
                <div>
                    <input
                        type="file"
                        id={`photo-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                        accept="image/*"
                        onChange={uploadPhoto}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor={`photo-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            background: uploading ? '#86868B' : '#0071E3',
                            color: '#fff',
                            borderRadius: '980px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Choose Photo'}
                    </label>
                    <p
                        style={{
                            fontSize: '13px',
                            color: '#86868B',
                            marginTop: '8px',
                        }}
                    >
                        JPG, PNG or GIF (max 5MB)
                    </p>
                </div>
            </div>
        </div>
    );
}
