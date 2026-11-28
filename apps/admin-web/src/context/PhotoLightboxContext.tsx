import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

export interface PhotoLightboxData {
    photoUrl?: string | null;
    title: string;
    subtitle?: string | null;
    badge?: string | null;
}

interface PhotoLightboxContextType {
    openPhoto: (data: PhotoLightboxData) => void;
    closePhoto: () => void;
}

const PhotoLightboxContext = createContext<PhotoLightboxContextType | undefined>(undefined);

export function PhotoLightboxProvider({ children }: { children: React.ReactNode }) {
    const [photoData, setPhotoData] = useState<PhotoLightboxData | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const openPhoto = useCallback((data: PhotoLightboxData) => {
        setPhotoData(data);
        setZoomLevel(1);
    }, []);

    const closePhoto = useCallback(() => {
        setPhotoData(null);
        setZoomLevel(1);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closePhoto();
            }
        };

        if (photoData) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [photoData, closePhoto]);

    // Global click listener for elements with data-lightbox-photo attribute
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest('[data-lightbox-photo]') as HTMLElement | null;
            if (target) {
                const photoUrl = target.getAttribute('data-lightbox-photo');
                const title = target.getAttribute('data-lightbox-title') || 'Student';
                const subtitle = target.getAttribute('data-lightbox-subtitle') || '';
                const badge = target.getAttribute('data-lightbox-badge') || '';

                if (photoUrl || title) {
                    e.stopPropagation();
                    e.preventDefault();
                    openPhoto({ photoUrl, title, subtitle, badge });
                }
            }
        };

        document.addEventListener('click', handleGlobalClick, true);
        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
        };
    }, [openPhoto]);

    const handleDownload = () => {
        if (!photoData?.photoUrl) return;
        const link = document.createElement('a');
        link.href = photoData.photoUrl;
        link.download = `${photoData.title.replace(/\s+/g, '_')}_profile.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <PhotoLightboxContext.Provider value={{ openPhoto, closePhoto }}>
            {children}
            {photoData && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 999999,
                        backgroundColor: 'rgba(0, 0, 0, 0.88)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={closePhoto}
                >
                    {/* Top Action Header */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            padding: '20px 28px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                            zIndex: 10,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: photoData.photoUrl ? `url(${photoData.photoUrl}) center/cover` : 'linear-gradient(135deg, #0071E3, #4facfe)',
                                border: '1.5px solid rgba(255,255,255,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '17px'
                            }}>
                                {!photoData.photoUrl && photoData.title.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{photoData.title}</span>
                                    {photoData.badge && (
                                        <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
                                            {photoData.badge}
                                        </span>
                                    )}
                                </div>
                                {photoData.subtitle && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', marginTop: '2px' }}>
                                        {photoData.subtitle}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Right Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {photoData.photoUrl && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setZoomLevel(prev => (prev === 1 ? 1.5 : 1))}
                                        title={zoomLevel === 1 ? "Zoom in" : "Reset zoom"}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    >
                                        <ZoomIn size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        title="Download Photo"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    >
                                        <Download size={18} />
                                    </button>
                                    <a
                                        href={photoData.photoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open full image in new tab"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.12)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={closePhoto}
                                title="Close (Esc)"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.18)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Centered Large Photo Container (WhatsApp Style) */}
                    <div
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '75vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'default',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {photoData.photoUrl ? (
                            <img
                                src={photoData.photoUrl}
                                alt={photoData.title}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '75vh',
                                    width: 'auto',
                                    height: 'auto',
                                    minWidth: '300px',
                                    minHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: '18px',
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                                    transform: `scale(${zoomLevel})`,
                                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '320px',
                                    height: '320px',
                                    borderRadius: '24px',
                                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                                }}
                            >
                                <div style={{ fontSize: '80px', fontWeight: '800', marginBottom: '8px' }}>
                                    {photoData.title.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>{photoData.title}</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                                    No profile picture uploaded
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Info Pill */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '24px',
                            background: 'rgba(20, 20, 22, 0.75)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            padding: '8px 18px',
                            borderRadius: '30px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span>Click outside or press <strong>Esc</strong> to close</span>
                    </div>
                </div>
            )}
        </PhotoLightboxContext.Provider>
    );
}

export function usePhotoLightbox() {
    const context = useContext(PhotoLightboxContext);
    if (!context) {
        throw new Error('usePhotoLightbox must be used within a PhotoLightboxProvider');
    }
    return context;
}
