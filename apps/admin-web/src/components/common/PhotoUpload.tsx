import { useState, useRef } from 'react';
import { Camera, UploadCloud, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './PhotoUpload.css';

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
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file) return;

        // Validation: Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size exceeds 5MB. Please choose a smaller photo.');
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to designated Supabase bucket
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) {
                // Fallback to 'avatars' bucket
                if (bucketName !== 'avatars') {
                    console.warn(`Upload to ${bucketName} failed, falling back to avatars...`, uploadError);
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

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            setPreview(data.publicUrl);
            onPhotoChange(data.publicUrl);
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo: ' + (error.message || 'Storage error'));
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview('');
        onPhotoChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="apple-photo-upload-wrapper">
            <span className="apple-photo-label">{label}</span>

            <div
                className={`apple-photo-dropzone ${isDragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />

                {/* Avatar Preview Sphere */}
                <div className="apple-avatar-preview">
                    {preview ? (
                        <img src={preview} alt="Profile" className="apple-avatar-image" />
                    ) : (
                        <div className="apple-avatar-empty">
                            <Camera size={34} className="apple-camera-icon" />
                        </div>
                    )}

                    {uploading && (
                        <div className="apple-avatar-loading-overlay">
                            <RefreshCw size={26} className="apple-spinner-icon" />
                        </div>
                    )}
                </div>

                {/* Info & Action Controls */}
                <div className="apple-photo-details">
                    <div className="apple-photo-actions">
                        <button
                            type="button"
                            className="apple-upload-btn"
                            disabled={uploading}
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <UploadCloud size={16} />
                            <span>{preview ? 'Change Photo' : 'Upload Photo'}</span>
                        </button>

                        {preview && (
                            <button
                                type="button"
                                className="apple-remove-btn"
                                onClick={handleRemove}
                                disabled={uploading}
                                title="Remove photo"
                            >
                                <X size={15} />
                                <span>Remove</span>
                            </button>
                        )}
                    </div>

                    <p className="apple-photo-hint">
                        Drag and drop or click to upload. JPG, PNG or WebP up to 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
}
