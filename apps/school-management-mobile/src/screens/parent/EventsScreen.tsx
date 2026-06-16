import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Dimensions, Platform, TouchableOpacity, Modal, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../config/supabase';
import { Event } from '../../types';

const EVENT_COLORS: Record<string, string> = {
    holiday: '#EF4444',
    exam: '#A855F7',
    sports: '#10B981',
    cultural: '#F59E0B',
    meeting: '#3B82F6',
    other: '#6B7280',
};

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function ParentEventsScreen() {
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

    // Filter and group upcoming events starting from today (excluding past events in the upcoming list)
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

            // Limit to max 3 dots per cell to avoid layout clutter
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
                selectedColor: '#A855F7',
            };
        }

        return marked;
    }, [events, selectedDate]);

    const formatSelectedDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 24 }} />
                <View style={styles.titleContainer}>
                    <Text style={styles.headerSubtitle}>SCHOOL CALENDAR</Text>
                    <Text style={styles.headerTitle}>Events & Calendar</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text style={styles.loadingText}>SYNCHRONIZING CALENDAR...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
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
                                        color="#A855F7" 
                                    />
                                )}
                                theme={{
                                    backgroundColor: '#150E28',
                                    calendarBackground: '#150E28',
                                    textSectionTitleColor: 'rgba(255, 255, 255, 0.6)',
                                    selectedDayBackgroundColor: '#A855F7',
                                    selectedDayTextColor: '#FFFFFF',
                                    todayTextColor: '#A855F7',
                                    dayTextColor: '#FFFFFF',
                                    textDisabledColor: 'rgba(255, 255, 255, 0.25)',
                                    dotColor: '#A855F7',
                                    selectedDotColor: '#FFFFFF',
                                    arrowColor: '#A855F7',
                                    monthTextColor: '#FFFFFF',
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
                                <Ionicons name="calendar-clear-outline" size={28} color="rgba(255, 255, 255, 0.2)" />
                                <Text style={styles.emptyDayText}>No events scheduled for this day</Text>
                            </View>
                        ) : (
                            selectedDateEvents.map((event) => {
                                const eventType = event.type?.toLowerCase() ?? 'other';
                                const color = EVENT_COLORS[eventType] ?? EVENT_COLORS.other;
                                return (
                                    <TouchableOpacity
                                        key={`sel-${event.id}`}
                                        style={[styles.eventCard, { borderLeftColor: color }]}
                                        onPress={() => setSelectedEvent(event)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.eventLeft}>
                                            <Text style={[styles.eventDay, { color }]}>
                                                {new Date(event.date).getDate()}
                                            </Text>
                                            <Text style={styles.eventWeekday}>
                                                {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                                            </Text>
                                        </View>
                                        <View style={styles.eventRight}>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                            {event.description ? (
                                                <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                                            ) : null}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                {event.type ? (
                                                    <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
                                                        <Text style={[styles.typeText, { color }]}>{event.type.toUpperCase()}</Text>
                                                    </View>
                                                ) : <View />}
                                                {event.images && event.images.length > 0 && (
                                                    <Ionicons name="image-outline" size={16} color="rgba(255, 255, 255, 0.4)" />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}

                        {/* Upcoming Events */}
                        <View style={[styles.sectionHeaderContainer, { marginTop: 28 }]}>
                            <Text style={styles.sectionTitle}>ALL UPCOMING EVENTS</Text>
                        </View>

                        {Object.keys(groupedUpcoming).length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="calendar-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
                                <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                                <Text style={styles.emptySub}>Check back later for upcoming school events</Text>
                            </View>
                        ) : (
                            Object.entries(groupedUpcoming).map(([month, monthEvents]) => (
                                <View key={month} style={{ marginBottom: 16 }}>
                                    <Text style={styles.monthLabel}>{month.toUpperCase()}</Text>
                                    {monthEvents.map((event) => {
                                        const eventType = event.type?.toLowerCase() ?? 'other';
                                        const color = EVENT_COLORS[eventType] ?? EVENT_COLORS.other;
                                        return (
                                            <TouchableOpacity
                                                key={`up-${event.id}`}
                                                style={[styles.eventCard, { borderLeftColor: color }]}
                                                onPress={() => setSelectedEvent(event)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.eventLeft}>
                                                    <Text style={[styles.eventDay, { color }]}>
                                                        {new Date(event.date).getDate()}
                                                    </Text>
                                                    <Text style={styles.eventWeekday}>
                                                        {new Date(event.date).toLocaleString('default', { weekday: 'short' })}
                                                    </Text>
                                                </View>
                                                <View style={styles.eventRight}>
                                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                                    {event.description ? (
                                                        <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                                                    ) : null}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                        {event.type ? (
                                                            <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
                                                                <Text style={[styles.typeText, { color }]}>{event.type.toUpperCase()}</Text>
                                                            </View>
                                                        ) : <View />}
                                                        {event.images && event.images.length > 0 && (
                                                            <Ionicons name="image-outline" size={16} color="rgba(255, 255, 255, 0.4)" />
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
                    animationType="slide"
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
                                    <Ionicons name="close" size={24} color="#FFFFFF" />
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
                                    <View style={[styles.typeBadge, { backgroundColor: (EVENT_COLORS[selectedEvent.type?.toLowerCase() || 'other'] || EVENT_COLORS.other) + '20' }]}>
                                        <Text style={[styles.typeText, { color: EVENT_COLORS[selectedEvent.type?.toLowerCase() || 'other'] || EVENT_COLORS.other }]}>
                                            {selectedEvent.type?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.eventTime}>
                                        <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 4 }} />
                                        <Text style={styles.modalTimeText}>
                                            {new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </Text>
                                    </View>
                                </View>

                                {selectedEvent.description ? (
                                    <Text style={styles.modalDescText}>{selectedEvent.description}</Text>
                                ) : (
                                    <Text style={[styles.modalDescText, { fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.4)' }]}>No description provided.</Text>
                                )}
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#A855F7', fontSize: 13, marginTop: 15, letterSpacing: 2, fontWeight: '600' },
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
    titleContainer: { flex: 1, alignItems: 'center' },
    headerSubtitle: { color: '#60A5FA', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
    headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    scrollContent: { paddingBottom: 100 },
    body: { padding: 16 },
    calendarContainer: {
        backgroundColor: '#150E28',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingVertical: 8,
        elevation: 2,
    },
    sectionHeaderContainer: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#C084FC',
        letterSpacing: 2,
    },
    dateSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '600',
        marginTop: 2,
    },
    emptyDayCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 16,
        gap: 6,
    },
    emptyDayText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '500',
    },
    monthLabel: { fontSize: 13, fontWeight: '800', color: '#C084FC', marginTop: 12, marginBottom: 12, letterSpacing: 2 },
    eventCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 16, flexDirection: 'row',
        marginBottom: 12, borderLeftWidth: 4, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
        elevation: 2,
    },
    eventLeft: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
    eventDay: { fontSize: 24, fontWeight: '800' },
    eventWeekday: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', fontWeight: '600', marginTop: 2 },
    eventRight: { flex: 1, padding: 14 },
    eventTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    eventDesc: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 4, lineHeight: 17 },
    typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    typeText: { fontSize: 10, fontWeight: '700' },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 20, padding: 48,
        alignItems: 'center', gap: 10, marginTop: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    emptySub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#110D26',
        borderRadius: 24,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
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
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 10,
    },
    modalCloseBtn: {
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
    },
    modalBody: {
        padding: 20,
    },
    modalImage: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        marginBottom: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    modalMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        flexWrap: 'wrap',
        gap: 8,
    },
    eventTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTimeText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500',
    },
    modalDescText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 22,
        marginBottom: 20,
    },
});

