import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
    StatusBar, ActivityIndicator, Image, Modal, Dimensions, Platform, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import * as FileSystem from 'expo-file-system/src/legacy';

const { width } = Dimensions.get('window');

export default function ParentHomeworkScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [homework, setHomework] = useState<any[]>([]);
    
    // Accordion Expansion State
    const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    // Shared values for pinch and pan zoom (two-finger gallery-like zoom)
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const savedTranslationX = useSharedValue(0);
    const savedTranslationY = useSharedValue(0);

    const imageHeight = Dimensions.get('window').height * 0.7;

    const clamp = (val: number, min: number, max: number) => {
        'worklet';
        return Math.min(Math.max(val, min), max);
    };

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (scale.value > 1) {
                const maxTx = (width * (scale.value - 1)) / 2;
                const maxTy = (imageHeight * (scale.value - 1)) / 2;
                translationX.value = clamp(savedTranslationX.value + e.translationX, -maxTx, maxTx);
                translationY.value = clamp(savedTranslationY.value + e.translationY, -maxTy, maxTy);
            }
        })
        .onEnd(() => {
            savedTranslationX.value = translationX.value;
            savedTranslationY.value = translationY.value;
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                translationX.value = withTiming(0);
                translationY.value = withTiming(0);
                savedScale.value = 1;
                savedTranslationX.value = 0;
                savedTranslationY.value = 0;
            } else {
                scale.value = withTiming(2.5);
                savedScale.value = 2.5;
            }
        });

    const composedGesture = Gesture.Exclusive(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateX: translationX.value },
                { translateY: translationY.value }
            ]
        };
    });

    const resetZoom = () => {
        scale.value = withTiming(1);
        translationX.value = withTiming(0);
        translationY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslationX.value = 0;
        savedTranslationY.value = 0;
    };

    const fetchHomework = async () => {
        try {
            if (user?.class_id) {
                const { data: hwData } = await supabase
                    .from('homework')
                    .select('*, teachers(id, full_name, photo_url, subjects)')
                    .eq('class_id', user.class_id)
                    .order('created_at', { ascending: false });
                
                // Filter homework based on individual target student_ids
                const studentId = user.id;
                const filteredHw = (hwData ?? []).filter((hw: any) => 
                    !hw.student_ids || 
                    hw.student_ids.length === 0 || 
                    hw.student_ids.includes(studentId)
                );
                
                setHomework(filteredHw);
            }
        } catch (e) {
            console.error('Fetch homework error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDownload = async () => {
        if (!fullScreenImage) return;
        
        if (Platform.OS === 'web') {
            try {
                const link = document.createElement('a');
                link.href = fullScreenImage;
                link.download = `homework_${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch {
                Linking.openURL(fullScreenImage);
            }
            return;
        }

        setDownloading(true);
        try {
            // Dynamic import of expo-media-library to avoid web bundling / startup errors
            const MediaLibrary = require('expo-media-library');

            let permissionGranted = false;
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
                permissionGranted = (status === 'granted');
            } catch (permError) {
                console.warn('MediaLibrary permission request failed, attempting direct save:', permError);
                // On Android 10+ (API 29+), write-only media saving does not require runtime permissions.
                permissionGranted = (Platform.OS === 'android');
            }

            if (!permissionGranted) {
                Alert.alert('Permission Denied', 'The app needs photos permission to save images to your gallery.');
                setDownloading(false);
                return;
            }

            const ext = fullScreenImage.split('.').pop()?.split('?')[0] || 'jpg';
            const localUri = `${FileSystem.documentDirectory}homework_${Date.now()}.${ext}`;
            
            const { uri } = await FileSystem.downloadAsync(fullScreenImage, localUri);
            
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('GKVS Homework', asset, false);
            
            Alert.alert('Success', 'Homework image saved to your gallery successfully!');
        } catch (error: any) {
            console.error('Failed to download image:', error);
            Alert.alert('Error', 'Failed to save image. Please check your internet connection and permissions.');
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        fetchHomework();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHomework();
    };

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#C084FC" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerSubtitle}>STUDENT ASSIGNMENTS</Text>
                    <Text style={styles.headerTitle}>Homework List</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text style={styles.loadingText}>SYNCHRONIZING HOMEWORK...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
                    showsVerticalScrollIndicator={false}
                >
                    {homework.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="book-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
                            <Text style={styles.emptyTitle}>No Homework Found</Text>
                            <Text style={styles.emptyText}>All assignments are completed or none have been assigned yet.</Text>
                        </View>
                    ) : (
                        homework.map((hw) => (
                            <TouchableOpacity
                                key={hw.id}
                                style={[
                                    styles.listCard,
                                    expandedHomeworkId === hw.id && { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.03)' }
                                ]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setExpandedHomeworkId(expandedHomeworkId === hw.id ? null : hw.id);
                                }}
                            >
                                <View style={styles.listCardHeader}>
                                    <View style={[styles.listIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                        <Ionicons name="book" size={18} color="#FBBF24" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.listCardTitle} numberOfLines={1}>{hw.title}</Text>
                                        <Text style={styles.listCardSubtitle} numberOfLines={1}>
                                            {hw.teachers?.full_name || 'Class Teacher'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        {hw.due_date && expandedHomeworkId !== hw.id && (
                                            <View style={styles.dueBadge}>
                                                <Text style={styles.dueBadgeText}>
                                                    Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </Text>
                                            </View>
                                        )}
                                        <Ionicons 
                                            name={expandedHomeworkId === hw.id ? "chevron-up" : "chevron-down"} 
                                            size={18} 
                                            color="rgba(255,255,255,0.4)" 
                                        />
                                    </View>
                                </View>

                                {expandedHomeworkId === hw.id && (
                                    <View style={styles.cardExpandedContent}>
                                        <View style={styles.hwDetailBadgeRow}>
                                            {hw.due_date && (
                                                <View style={styles.modalBadge}>
                                                    <Ionicons name="calendar-outline" size={14} color="#C084FC" />
                                                    <Text style={styles.modalBadgeText}>
                                                        Due: {new Date(hw.due_date).toLocaleDateString('en-IN')}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.modalBadge}>
                                                <Ionicons name="book-outline" size={14} color="#C084FC" />
                                                <Text style={styles.modalBadgeText}>
                                                    {hw.subject_id || 'Subject'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Teacher Info */}
                                        <View style={styles.teacherDetailCard}>
                                            <Text style={styles.teacherDetailLabel}>Assigned By</Text>
                                            <View style={styles.teacherDetailRow}>
                                                <View style={styles.teacherAvatarDetail}>
                                                    {hw.teachers?.photo_url ? (
                                                        <Image source={{ uri: hw.teachers.photo_url }} style={styles.avatarImage} />
                                                    ) : (
                                                        <Text style={styles.avatarText}>
                                                            {hw.teachers?.full_name?.charAt(0).toUpperCase() || 'T'}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={styles.teacherDetailTextCol}>
                                                    <Text style={styles.teacherDetailName}>{hw.teachers?.full_name || 'Admin'}</Text>
                                                    <Text style={styles.teacherDetailSubject}>
                                                        {hw.teachers?.subjects ? hw.teachers.subjects.join(', ') : 'Teacher'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {hw.attachments && hw.attachments.length > 0 && (
                                            <View style={{ marginBottom: 4 }}>
                                                <Text style={styles.hwDetailDescTitle}>Attached Photo:</Text>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => setFullScreenImage(hw.attachments[0])}
                                                    style={styles.attachmentButton}
                                                >
                                                    <Image source={{ uri: hw.attachments[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        <View>
                                            <Text style={styles.hwDetailDescTitle}>Instructions:</Text>
                                            <Text style={styles.hwDetailDesc}>{hw.description || 'No instructions provided.'}</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Full Screen Image Modal */}
            <Modal
                visible={fullScreenImage !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setFullScreenImage(null);
                    resetZoom();
                }}
            >
                <View style={styles.fullScreenImageContainer}>
                    {/* Header Controls Bar */}
                    <View style={styles.modalHeaderBar}>
                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={() => {
                                setFullScreenImage(null);
                                resetZoom();
                            }}
                        >
                            <Ionicons name="close" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Homework Sheet</Text>
                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={handleDownload}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="download" size={24} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {fullScreenImage && (
                        <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            <GestureDetector gesture={composedGesture}>
                                <Animated.Image
                                    source={{ uri: fullScreenImage }}
                                    style={[
                                        {
                                            width: width,
                                            height: imageHeight,
                                        },
                                        animatedImageStyle
                                    ]}
                                    resizeMode="contain"
                                />
                            </GestureDetector>
                        </View>
                    )}

                    {/* Zoom Control Bar */}
                    <View style={styles.zoomControlBar}>
                        <TouchableOpacity
                            style={styles.zoomBtn}
                            onPress={() => {
                                const newScale = Math.max(1, savedScale.value - 0.5);
                                scale.value = withTiming(newScale);
                                savedScale.value = newScale;
                                if (newScale === 1) {
                                    translationX.value = withTiming(0);
                                    translationY.value = withTiming(0);
                                    savedTranslationX.value = 0;
                                    savedTranslationY.value = 0;
                                }
                            }}
                        >
                            <Ionicons name="remove-circle-outline" size={26} color="#FFF" />
                            <Text style={styles.zoomBtnText}>Zoom Out</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.zoomBtn, styles.zoomBtnReset]}
                            onPress={resetZoom}
                        >
                            <Ionicons name="refresh-circle-outline" size={24} color="#FFF" />
                            <Text style={styles.zoomBtnText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.zoomBtn}
                            onPress={() => {
                                const newScale = Math.min(5, savedScale.value + 0.5);
                                scale.value = withTiming(newScale);
                                savedScale.value = newScale;
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={26} color="#FFF" />
                            <Text style={styles.zoomBtnText}>Zoom In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#FF6A00', fontSize: 13, marginTop: 15, letterSpacing: 2, fontWeight: '600' },
    header: { 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingHorizontal: 15, 
        paddingBottom: 15, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleContainer: { flex: 1, alignItems: 'center', marginRight: 10 },
    headerSubtitle: { color: '#FBBF24', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
    headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 36, alignItems: 'center', gap: 12, marginTop: 40,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    emptyText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', lineHeight: 18 },
    listCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 14, marginBottom: 12,
    },
    listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    listIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    listCardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    listCardSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    dueBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dueBadgeText: { fontSize: 10, fontWeight: '700', color: '#FBBF24' },
    cardExpandedContent: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)', paddingTop: 14, gap: 14 },
    hwDetailBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    modalBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(168, 85, 247, 0.12)', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 5
    },
    modalBadgeText: { fontSize: 11, color: '#C084FC', fontWeight: '600' },
    teacherDetailCard: {
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 8,
    },
    teacherDetailLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
    teacherDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    teacherAvatarDetail: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    teacherDetailTextCol: { flex: 1 },
    teacherDetailName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    teacherDetailSubject: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    hwDetailDescTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
    hwDetailDesc: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 22 },
    attachmentButton: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 8 },
    fullScreenImageContainer: { flex: 1, backgroundColor: '#090514', justifyContent: 'center', alignItems: 'center' },
    modalHeaderBar: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: Platform.OS === 'ios' ? 50 : 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalHeaderTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    headerBtn: { padding: 8 },
    zoomControlBar: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(21, 14, 40, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    zoomBtn: { alignItems: 'center', minWidth: 70 },
    zoomBtnReset: { opacity: 0.8 },
    zoomBtnText: { color: '#FFF', fontSize: 11, fontWeight: '600', marginTop: 4 },
});
