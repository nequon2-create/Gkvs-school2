import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Dimensions
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
        const { data } = await supabase
            .from('events').select('*').order('date', { ascending: true });
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
                                    <View key={event.id} style={[styles.eventCard, { borderLeftColor: color }]}>
                                        <View style={styles.eventLeft}>
                                            <Text style={[styles.eventDay, { color }]}>{new Date(event.date).getDate()}</Text>
                                            <Text style={styles.eventWeekday}>
                                                {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                                            </Text>
                                        </View>
                                        <View style={styles.eventRight}>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                            {event.description ? <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text> : null}
                                            {event.type ? (
                                                <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                                                    <Text style={[styles.typeText, { color }]}>{event.type.toUpperCase()}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
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
        marginBottom: 10, borderLeftWidth: 4,
        elevation: 2,
    },
    eventLeft: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    eventDay: { fontSize: 22, fontWeight: '800' },
    eventWeekday: { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
    eventRight: { flex: 1, padding: 12 },
    eventTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    eventDesc: { fontSize: 12, color: '#718096', marginTop: 4, lineHeight: 17 },
    typeBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
    typeText: { fontSize: 10, fontWeight: '700' },
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 48, alignItems: 'center', gap: 10, marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4A5568' },
    emptySub: { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },
});
