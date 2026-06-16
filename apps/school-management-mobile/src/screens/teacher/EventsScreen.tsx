import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Platform, TouchableOpacity, Modal, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../config/supabase';
import { Event } from '../../types';

const EVENT_COLORS: Record<string, string> = {
    holiday: '#E53E3E',
    exam: '#805AD5',
    sports: '#38A169',
    cultural: '#D69E2E',
    meeting: '#3182CE',
    other: '#718096',
};

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TeacherEventsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const fetchEvents = async () => {
        try {
            // Fetch all Events for the calendar grid
            const { data } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });
            setEvents(data ?? []);
        } catch (e) {
            console.error('Fetch events error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    // Filter events for the selected date
    const selectedDateEvents = useMemo(() => {
        return events.filter((e) => {
            if (!e.date) return false;
            return e.date.split('T')[0] === selectedDate;
        });
    }, [events, selectedDate]);

    // Filter and group upcoming events starting from today
    const groupedUpcoming = useMemo(() => {
        const todayStr = getTodayString();
        const upcoming = events.filter((e) => e.date >= todayStr);
        const grouped: Record<string, Event[]> = {};
        
        upcoming.forEach((e) => {
            const month = new Date(e.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(e);
        });
        return grouped;
    }, [events]);

    // Generate marked dates for react-native-calendars
    const markedDates = useMemo(() => {
        const marked: Record<string, any> = {};

        // Populate event dots
        events.forEach((e) => {
            if (!e.date) return;
            const dateStr = e.date.split('T')[0];
            const type = e.type?.toLowerCase() ?? 'other';
            const color = EVENT_COLORS[type] ?? EVENT_COLORS.other;

            if (!marked[dateStr]) {
                marked[dateStr] = {
                    marked: true,
                    dots: [],
                };
            }

            // Limit to max 3 dots per cell
            if (marked[dateStr].dots.length < 3) {
                marked[dateStr].dots.push({
                    key: `${e.id}`,
                    color: color,
                    selectedDotColor: '#FFFFFF',
                });
            }
        });

        // Highlight selected date
        if (selectedDate) {
            marked[selectedDate] = {
                ...marked[selectedDate],
                selected: true,
                selectedColor: '#2D7D46',
            };
        }

        return marked;
    }, [events, selectedDate]);

    const formatSelectedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <Ionicons name="calendar" size={28} color="#FFFFFF" />
                <Text style={styles.headerTitle}>Events & Calendar</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#2D7D46" />
                    <Text style={styles.loadingText}>SYNCHRONIZING CALENDAR...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.body}>
                        {/* Native Calendar Grid */}
                        <View style={styles.calendarContainer}>
                            <Calendar
                                current={selectedDate}
                                onDayPress={(day) => setSelectedDate(day.dateString)}
                                monthFormat={'MMMM yyyy'}
                                firstDay={1}
                                hideExtraDays={false}
                                disableMonthChange={false}
                                enableSwipeMonths={true}
                                markingType={'multi-dot'}
                                markedDates={markedDates}
                                renderArrow={(direction) => (
                                    <Ionicons 
                                        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
                                        size={20} 
                                        color="#2D7D46" 
                                    />
                                )}
                                theme={{
                                    backgroundColor: '#FFFFFF',
                                    calendarBackground: '#FFFFFF',
                                    textSectionTitleColor: '#718096',
                                    selectedDayBackgroundColor: '#2D7D46',
                                    selectedDayTextColor: '#FFFFFF',
                                    todayTextColor: '#2D7D46',
                                    dayTextColor: '#2D3748',
                                    textDisabledColor: '#CBD5E0',
                                    dotColor: '#2D7D46',
                                    selectedDotColor: '#FFFFFF',
                                    arrowColor: '#2D7D46',
                                    monthTextColor: '#2D7D46',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '600',
                                    textDayFontSize: 14,
                                    textMonthFontSize: 16,
                                    textDayHeaderFontSize: 12
                                }}
                            />
                        </View>

                        {/* Selected Date Events */}
                        <View style={styles.sectionHeaderContainer}>
                            <Text style={styles.sectionTitle}>
                                {selectedDate === getTodayString() ? "TODAY'S EVENTS" : "SCHEDULED EVENTS"}
                            </Text>
                            <Text style={styles.dateSubtitle}>{formatSelectedDate(selectedDate)}</Text>
                        </View>

                        {selectedDateEvents.length === 0 ? (
                            <View style={styles.emptyDayCard}>
                                <Ionicons name="calendar-clear-outline" size={28} color="#A0AEC0" />
                                <Text style={styles.emptyDayText}>No events scheduled for this day</Text>
                            </View>
                        ) : (
                            selectedDateEvents.map((event) => {
                                const color = EVENT_COLORS[event.type?.toLowerCase() ?? ''] ?? '#2D7D46';
                                return (
                                    <TouchableOpacity
                                        key={`sel-${event.id}`}
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
                            })
                        )}

                        {/* Upcoming Events */}
                        <View style={[styles.sectionHeaderContainer, { marginTop: 24 }]}>
                            <Text style={styles.sectionTitle}>ALL UPCOMING EVENTS</Text>
                        </View>

                        {Object.keys(groupedUpcoming).length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="calendar-outline" size={48} color="#CBD5E0" />
                                <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                                <Text style={styles.emptySub}>Events will appear here when added by admin</Text>
                            </View>
                        ) : (
                            Object.entries(groupedUpcoming).map(([month, monthEvents]) => (
                                <View key={month} style={{ marginBottom: 16 }}>
                                    <Text style={styles.monthLabel}>{month}</Text>
                                    {monthEvents.map((event) => {
                                        const color = EVENT_COLORS[event.type?.toLowerCase() ?? ''] ?? '#2D7D46';
                                        return (
                                            <TouchableOpacity
                                                key={`up-${event.id}`}
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
            )}

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
    loadingText: { color: '#2D7D46', fontSize: 13, marginTop: 15, letterSpacing: 2, fontWeight: '600' },
    header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    scrollContent: { paddingBottom: 100 },
    body: { padding: 16 },
    calendarContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        paddingVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionHeaderContainer: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D7D46',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dateSubtitle: {
        fontSize: 12,
        color: '#718096',
        fontWeight: '600',
        marginTop: 2,
    },
    emptyDayCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        gap: 6,
    },
    emptyDayText: {
        fontSize: 12,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    monthLabel: { fontSize: 14, fontWeight: '700', color: '#2D7D46', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
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
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 48, alignItems: 'center', gap: 10, marginTop: 16 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#4A5568' },
    emptySub: { fontSize: 12, color: '#A0AEC0', textAlign: 'center' },
    
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
