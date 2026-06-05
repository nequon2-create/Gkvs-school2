import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Image, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRatingsLeaderboard'>;

interface LeaderboardItem {
    id: string;
    full_name: string;
    photo_url: string | null;
    subjects: string[] | null;
    qualification: string | null;
    averageRating: number;
    totalReviews: number;
}

export default function TeacherRatingsLeaderboardScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

    const fetchData = async () => {
        try {
            // Fetch teachers
            const { data: teachersData, error: teachersError } = await supabase
                .from('teachers')
                .select('id, full_name, subjects, photo_url, qualification')
                .order('full_name', { ascending: true });

            if (teachersError) throw teachersError;

            // Fetch current month ratings
            const currentMonth = new Date().toISOString().substring(0, 7);
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('teacher_ratings')
                .select('teacher_id, rating')
                .eq('rating_month', currentMonth);

            if (ratingsError) throw ratingsError;

            // Aggregate ratings in memory
            const ratingsMap: Record<string, { total: number; count: number }> = {};
            if (ratingsData) {
                ratingsData.forEach((item: any) => {
                    if (!ratingsMap[item.teacher_id]) {
                        ratingsMap[item.teacher_id] = { total: 0, count: 0 };
                    }
                    ratingsMap[item.teacher_id].total += item.rating;
                    ratingsMap[item.teacher_id].count += 1;
                });
            }

            // Combine and sort (by avg rating desc, then review count desc, then name asc)
            const ranked = (teachersData ?? []).map(teacher => {
                const stats = ratingsMap[teacher.id];
                const avg = stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0;
                const count = stats ? stats.count : 0;
                return {
                    ...teacher,
                    averageRating: avg,
                    totalReviews: count
                };
            }).sort((a, b) => {
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating;
                }
                if (b.totalReviews !== a.totalReviews) {
                    return b.totalReviews - a.totalReviews;
                }
                return a.full_name.localeCompare(b.full_name);
            });

            setLeaderboard(ranked);
        } catch (e) {
            console.error('Leaderboard fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Teacher Leaderboard</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Monthly performance leaderboard for {currentMonthLabel} based on parent reviews.
                </Text>

                {leaderboard.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
                        <Text style={styles.emptyText}>No teachers found</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {leaderboard.map((item, index) => {
                            const rank = index + 1;
                            const hasRating = item.totalReviews > 0;
                            const percentage = hasRating ? (item.averageRating / 5) * 100 : 0;

                            // Determine card background and border based on rank
                            let cardGradientColors: [string, string] = ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)'];
                            let borderColor = 'rgba(255, 255, 255, 0.06)';
                            
                            if (rank === 1) {
                                cardGradientColors = ['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.01)'];
                                borderColor = 'rgba(251, 191, 36, 0.2)';
                            } else if (rank === 2) {
                                cardGradientColors = ['rgba(226, 232, 240, 0.06)', 'rgba(226, 232, 240, 0.01)'];
                                borderColor = 'rgba(226, 232, 240, 0.15)';
                            } else if (rank === 3) {
                                cardGradientColors = ['rgba(217, 119, 6, 0.06)', 'rgba(217, 119, 6, 0.01)'];
                                borderColor = 'rgba(217, 119, 6, 0.15)';
                            }

                            return (
                                <LinearGradient
                                    key={item.id}
                                    colors={cardGradientColors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.itemCard, { borderColor }]}
                                >
                                    <View style={styles.itemContent}>
                                        {/* Rank Column */}
                                        <View style={styles.rankCol}>
                                            {rank <= 3 ? (
                                                <Text style={styles.medal}>
                                                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                                </Text>
                                            ) : (
                                                <Text style={styles.rankText}>{rank}</Text>
                                            )}
                                        </View>

                                        {/* Avatar Column */}
                                        <View style={styles.avatarContainer}>
                                            {item.photo_url ? (
                                                <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
                                            ) : (
                                                <View style={styles.avatarPlaceholder}>
                                                    <Text style={styles.avatarPlaceholderText}>
                                                        {getInitials(item.full_name)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Info Column */}
                                        <View style={styles.infoCol}>
                                            <View style={styles.infoHeader}>
                                                <Text style={styles.name} numberOfLines={1}>
                                                    {item.full_name}
                                                </Text>
                                                {hasRating ? (
                                                    <View style={styles.ratingRow}>
                                                        <Ionicons name="star" size={13} style={styles.starIcon} />
                                                        <Text style={styles.ratingText}>
                                                            {item.averageRating.toFixed(1)}
                                                        </Text>
                                                        <Text style={styles.reviewCountText}>
                                                            ({item.totalReviews})
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.noRatingsText}>No ratings</Text>
                                                )}
                                            </View>

                                            {item.subjects && item.subjects.length > 0 ? (
                                                <Text style={styles.subjectsText} numberOfLines={1}>
                                                    {item.subjects.join(', ')}
                                                </Text>
                                            ) : (
                                                <Text style={styles.subjectsText}>General Teacher</Text>
                                            )}

                                            {/* Progress bar representing ratings */}
                                            <View style={styles.progressBarBg}>
                                                {hasRating ? (
                                                    <LinearGradient
                                                        colors={['#FBBF24', '#10B981']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={[styles.progressBarFill, { width: `${percentage}%` }]}
                                                    />
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                </LinearGradient>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090514' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(9, 5, 20, 0.5)',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    subtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', marginBottom: 20, lineHeight: 18 },
    list: { gap: 12 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 },
    
    // Leaderboard Item Styles
    itemCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
    },
    itemContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    
    // Rank Column
    rankCol: { width: 32, alignItems: 'center', justifyContent: 'center' },
    medal: { fontSize: 20 },
    rankText: { fontSize: 14, fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)' },
    
    // Avatar Column
    avatarContainer: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#1A152E', justifyContent: 'center', alignItems: 'center' },
    avatarPlaceholderText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    
    // Info Column
    infoCol: { flex: 1, minWidth: 0 },
    infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1, marginRight: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    starIcon: { color: '#FBBF24', marginRight: 2 },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    reviewCountText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },
    subjectsText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginBottom: 8 },
    noRatingsText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.3)' },
    
    // Progress Bar
    progressBarBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 2 }
});
