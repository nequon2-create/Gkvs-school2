import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Dimensions, Platform, TouchableOpacity, Modal, Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { Event } from '../../types';

const EVENT_COLORS: Record<string, string> = {
    holiday: '#E53E3E', exam: '#805AD5', sports: '#38A169',
    cultural: '#D69E2E', meeting: '#3182CE',
};

export default function TeacherEventsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const fetchEvents = async () => {
        // Fetch Calendar URL
        const { data: settings } = await supabase
            .from('school_settings')
            .select('calendar_embed_url')
            .limit(1);

        if (settings && settings.length > 0 && settings[0].calendar_embed_url) {
            setCalendarUrl(settings[0].calendar_embed_url);
        }

        // Fetch Events
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('events')
            .select('*')
            .gte('date', today)
            .order('date', { ascending: true });
        setEvents(data ?? []);
        setLoading(false); setRefreshing(false);
    };

    useEffect(() => { fetchEvents(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchEvents(); };

    const grouped: Record<string, Event[]> = {};
    events.forEach((e) => {
        const month = new Date(e.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(e);
    });

    if (loading) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                    <Ionicons name="calendar" size={28} color="#FFFFFF" />
                    <Text style={styles.headerTitle}>Events & Calendar</Text>
                </LinearGradient>

                <View style={styles.body}>
                    {calendarUrl ? (
                        <View style={styles.calendarContainer}>
                            {Platform.OS === 'web' ? (
                                <iframe
                                    src={calendarUrl}
                                    style={{ width: '100%', height: '100%', border: 0 }}
                                    title="School Calendar"
                                />
                            ) : (
                                <WebView
                                    source={{ uri: calendarUrl }}
                                    style={styles.webview}
                                    scrollEnabled={true}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    startInLoadingState={true}
                                    scalesPageToFit={true}
                                    showsVerticalScrollIndicator={false}
                                    showsHorizontalScrollIndicator={false}
                                />
                            )}
                        </View>
                    ) : null}

                    {Object.keys(grouped).length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="calendar-outline" size={48} color="#CBD5E0" />
                            <Text style={styles.emptyTitle}>No Events Yet</Text>
                            <Text style={styles.emptySub}>Events will appear here when added by admin</Text>
                        </View>
                    ) : (
                        Object.entries(grouped).map(([month, monthEvents]) => (
                            <View key={month}>
                                <Text style={styles.monthLabel}>{month}</Text>
                                {monthEvents.map((event) => {
                                    const color = EVENT_COLORS[event.type?.toLowerCase() ?? ''] ?? '#2D7D46';
                                    return (
                                        <TouchableOpacity
                                            key={event.id}
                                            style={[styles.eventCard, { borderLeftColor: color }]}
                                            onPress={() => setSelectedEvent(event)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.eventLeft}>
                                                <Text style={[styles.eventDay, { color }]}>{new Date(event.date).getDate()}</Text>
                                                <Text style={styles.eventWeekday}>
                                                    {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                                                </Text>
                                            </View>
                                            <View style={styles.eventRight}>
                                                <Text style={styles.eventTitle}>{event.title}</Text>
                                                {event.description ? <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text> : null}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                                                    {event.type ? (
                                                        <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                                                            <Text style={[styles.typeText, { color }]}>{event.type.toUpperCase()}</Text>
                                                        </View>
                                                    ) : null}
                                                    {event.images && event.images.length > 0 && (
                                                        <Ionicons name="image-outline" size={16} color="#718096" />
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Event Details Modal */}
            {selectedEvent && (
                <Modal
                    visible={!!selectedEvent}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedEvent(null)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedEvent(null)}
                    >
                        <TouchableOpacity
                            style={styles.modalContent}
                            activeOpacity={1}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedEvent.title}</Text>
                                <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={24} color="#718096" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                {selectedEvent.images && selectedEvent.images.length > 0 && (
                                    <Image
                                        source={{ uri: selectedEvent.images[0] }}
                                        style={styles.modalImage}
                                        resizeMode="cover"
                                    />
                                )}

                                <View style={styles.modalMetaRow}>
                                    <View style={[styles.typeBadge, { backgroundColor: (EVENT_COLORS[selectedEvent.type?.toLowerCase() || 'other'] || '#2D7D46') + '20' }]}>
                                        <Text style={[styles.typeText, { color: EVENT_COLORS[selectedEvent.type?.toLowerCase() || 'other'] || '#2D7D46' }]}>
                                            {selectedEvent.type?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.eventTime}>
                                        <Ionicons name="time-outline" size={14} color="#718096" style={{ marginRight: 4 }} />
                                        <Text style={styles.modalTimeText}>
                                            {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </Text>
                                    </View>
                                </View>

                                {selectedEvent.description ? (
                                    <Text style={styles.modalDescText}>{selectedEvent.description}</Text>
                                ) : (
                                    <Text style={[styles.modalDescText, { fontStyle: 'italic', color: '#A0AEC0' }]}>No description provided.</Text>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    body: { padding: 16 },
    calendarContainer: {
        height: Dimensions.get('window').height * 0.45,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 2,
    },
    webview: { flex: 1, backgroundColor: 'transparent' },
    monthLabel: { fontSize: 14, fontWeight: '700', color: '#2D7D46', marginTop: 8, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    eventCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row',
        marginBottom: 10, borderLeftWidth: 4, overflow: 'hidden',
        elevation: 2,
    },
    eventLeft: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    eventDay: { fontSize: 22, fontWeight: '800' },
    eventWeekday: { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
    eventRight: { flex: 1, padding: 12 },
    eventTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    eventDesc: { fontSize: 12, color: '#718096', marginTop: 4, lineHeight: 17 },
    typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    typeText: { fontSize: 10, fontWeight: '700' },
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 48, alignItems: 'center', gap: 10, marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4A5568' },
    emptySub: { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        flex: 1,
        marginRight: 10,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    modalImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#F7FAFC',
    },
    modalMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
    },
    eventTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTimeText: {
        fontSize: 13,
        color: '#718096',
        fontWeight: '500',
    },
    modalDescText: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 22,
        marginBottom: 20,
    },
});
