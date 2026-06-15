import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
    Image, Dimensions, Animated, Pressable, Modal, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { SoundEffects, SoundRef } from '../../components/SoundEffects';

const { width, height } = Dimensions.get('window');

interface SubjectMark {
    subject_name: string;
    subject_code: string;
    marks_obtained: number;
    max_marks: number;
    grade: string;
}

interface LeaderboardStudent {
    student_id: string;
    full_name: string;
    photo_url: string | null;
    avgMarks: number;
    totalObtained: number;
    totalMax: number;
    rank: number;
    subjects: SubjectMark[];
}

interface Exam {
    id: string;
    exam_name: string;
    exam_type: string;
}

const getCardRankStyles = (rank: number) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    let tintColor = '#00ff66';
    let borderColor = '#00ff66';
    let glowColor = 'rgba(0, 255, 102, 0.4)';
    let circuitBg = 'rgba(0, 255, 102, 0.25)';
    let panelBg = 'rgba(0, 20, 5, 0.9)';
    let textGlow = '#00ff66';
    let textColor = '#00ff66';
    let subTextColor = '#ffffff';
    let statBoxBorder = 'rgba(0, 255, 102, 0.3)';

    if (isGold) {
        tintColor = '#FFD700';
        borderColor = '#FFD700';
        glowColor = 'rgba(255, 215, 0, 0.6)';
        circuitBg = 'rgba(255, 215, 0, 0.2)';
        panelBg = 'rgba(20, 14, 0, 0.98)';
        textGlow = '#FFD700';
        textColor = '#FFD700';
        subTextColor = 'rgba(255, 215, 0, 0.65)';
        statBoxBorder = 'rgba(255, 215, 0, 0.6)';
    } else if (isSilver) {
        tintColor = '#c8d2dc';
        borderColor = '#c8d2dc';
        glowColor = 'rgba(200, 210, 220, 0.5)';
        circuitBg = 'rgba(200, 210, 220, 0.2)';
        panelBg = 'rgba(10, 12, 15, 0.98)';
        textGlow = '#c8d2dc';
        textColor = '#c8d2dc';
        subTextColor = 'rgba(200, 210, 220, 0.65)';
        statBoxBorder = 'rgba(200, 210, 220, 0.6)';
    } else if (isBronze) {
        tintColor = '#FF7A00';
        borderColor = '#FF7A00';
        glowColor = 'rgba(255, 122, 0, 0.5)';
        circuitBg = 'rgba(255, 122, 0, 0.2)';
        panelBg = 'rgba(25, 10, 0, 0.98)';
        textGlow = '#FF7A00';
        textColor = '#FF7A00';
        subTextColor = 'rgba(255, 122, 0, 0.65)';
        statBoxBorder = 'rgba(255, 122, 0, 0.6)';
    }

    return {
        tintColor,
        borderColor,
        glowColor,
        circuitBg,
        panelBg,
        textGlow,
        textColor,
        subTextColor,
        statBoxBorder,
    };
};

export default function ParentLeaderboardScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const soundRef = useRef<SoundRef>(null);
    
    const [loading, setLoading] = useState(true);
    const [className, setClassName] = useState('My Class');
    const [activeExam, setActiveExam] = useState<Exam | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
    
    // Modal & Overlay Animation State
    const [selectedStudent, setSelectedStudent] = useState<LeaderboardStudent | null>(null);
    const [cardFlipped, setCardFlipped] = useState(false);
    
    // Animated values for popup
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.3)).current;
    const cardRotation = useRef(new Animated.Value(0)).current;
    const orbitRotateCW = useRef(new Animated.Value(0)).current;
    const orbitRotateCCW = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (user?.class_id) {
            fetchClassDetails();
        }
    }, [user]);

    const fetchClassDetails = async () => {
        try {
            const { data } = await supabase
                .from('classes')
                .select('class_name, section')
                .eq('id', user?.class_id)
                .single();

            if (data) {
                setClassName(`${data.class_name} ${data.section || ''}`);
            }

            // 1. Fetch active students in class
            let studentsQuery = supabase
                .from('students')
                .select('id')
                .eq('class_id', user?.class_id)
                .eq('is_active', true);

            if (user?.academic_year_id) {
                studentsQuery = studentsQuery.eq('academic_year_id', user.academic_year_id);
            }

            const { data: studentsData } = await studentsQuery;

            const studentIds = studentsData?.map(s => s.id) || [];
            
            // 2. Fetch distinct exam_ids with marks for this class's students
            let examsWithMarks: string[] = [];
            if (studentIds.length > 0) {
                const { data: marksExams } = await supabase
                    .from('marks')
                    .select('exam_id')
                    .in('student_id', studentIds);
                
                examsWithMarks = Array.from(new Set(marksExams?.map(m => m.exam_id) || []));
            }

            // 3. Fetch published exams for this class
            let examsQuery = supabase
                .from('exams')
                .select('id, exam_name, exam_type')
                .eq('class_id', user?.class_id)
                .eq('is_published', true);

            if (user?.academic_year_id) {
                examsQuery = examsQuery.eq('academic_year_id', user.academic_year_id);
            }

            const { data: examsData } = await examsQuery.order('exam_date', { ascending: false });

            // 4. Filter exams to only show those that have marks uploaded
            const filteredExams = examsData ? examsData.filter(ex => examsWithMarks.includes(ex.id)) : [];

            if (filteredExams.length > 0) {
                const latestExam = filteredExams[0];
                setActiveExam(latestExam);
                fetchLeaderboard(latestExam.id);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error('Error fetching class/exams:', e);
            setLoading(false);
        }
    };

    const fetchLeaderboard = async (examId: string) => {
        setLoading(true);
        try {
            if (!user?.class_id) {
                setLoading(false);
                return;
            }

            // 1. Fetch active students in class
            let studentsQuery = supabase
                .from('students')
                .select('id, full_name, photo_url')
                .eq('class_id', user.class_id)
                .eq('is_active', true);

            if (user.academic_year_id) {
                studentsQuery = studentsQuery.eq('academic_year_id', user.academic_year_id);
            }

            const { data: studentsData, error: studentsError } = await studentsQuery;

            if (studentsError) throw studentsError;

            // 2. Fetch subjects for class (including global/fallback subjects)
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, subject_name, subject_code')
                .or(`class_id.eq.${user.class_id},class_id.is.null`);

            if (subjectsError) throw subjectsError;

            // 3. Fetch marks for exam
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select('student_id, subject_id, marks_obtained, max_marks, grade')
                .eq('exam_id', examId);

            if (marksError) throw marksError;

            const subjectMap = new Map(subjectsData?.map(s => [s.id, s]) || []);
            const studentMap: Record<string, {
                student_id: string;
                full_name: string;
                photo_url: string | null;
                totalObtained: number;
                totalMax: number;
                subjects: SubjectMark[];
            }> = {};

            // Initialize all active students in class
            (studentsData || []).forEach(student => {
                studentMap[student.id] = {
                    student_id: student.id,
                    full_name: student.full_name,
                    photo_url: student.photo_url,
                    totalObtained: 0,
                    totalMax: 0,
                    subjects: []
                };
            });

            // Process mark records
            (marksData || []).forEach(mark => {
                const student = studentMap[mark.student_id];
                if (!student) return;

                const subject = subjectMap.get(mark.subject_id);
                if (!subject) return;

                student.totalObtained += mark.marks_obtained || 0;
                student.totalMax += mark.max_marks || 100;
                
                student.subjects.push({
                    subject_name: subject.subject_name,
                    subject_code: subject.subject_code,
                    marks_obtained: mark.marks_obtained,
                    max_marks: mark.max_marks,
                    grade: mark.grade || 'N/A'
                });
            });

            // Filter out students with zero marks
            const rawList = Object.values(studentMap)
                .map(s => {
                    const avgMarks = s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0;
                    return {
                        ...s,
                        avgMarks
                    };
                })
                .filter(s => s.subjects.length > 0);

            rawList.sort((a, b) => b.avgMarks - a.avgMarks);

            const rankedList: LeaderboardStudent[] = rawList.map((s, index) => ({
                ...s,
                rank: index + 1
            }));

            setLeaderboard(rankedList);
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (student: LeaderboardStudent) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedStudent(student);
        setCardFlipped(false);
        cardRotation.setValue(0);
        
        orbitRotateCW.setValue(0);
        orbitRotateCCW.setValue(0);
        
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                friction: 7,
                tension: 15,
                useNativeDriver: true
            }),
            Animated.loop(
                Animated.timing(orbitRotateCW, {
                    toValue: 1,
                    duration: 12000,
                    useNativeDriver: true
                })
            ),
            Animated.loop(
                Animated.timing(orbitRotateCCW, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true
                })
            )
        ]).start();

        // Play high-energy level up sound for popup
        soundRef.current?.playWin();
    };

    const handleCardFlip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const toValue = cardFlipped ? 0 : 180;
        
        // Play audio
        soundRef.current?.playFlip();

        Animated.spring(cardRotation, {
            toValue: toValue,
            friction: 8,
            tension: 10,
            useNativeDriver: true
        }).start();

        setCardFlipped(!cardFlipped);
    };

    const handleCloseCard = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(cardScale, {
                toValue: 0.3,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => {
            setSelectedStudent(null);
        });
    };

    // Card Rotation interpolation
    const frontRotate = cardRotation.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backRotate = cardRotation.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = cardRotation.interpolate({
        inputRange: [0, 89, 90, 180],
        outputRange: [1, 1, 0, 0]
    });

    const backOpacity = cardRotation.interpolate({
        inputRange: [0, 89, 90, 180],
        outputRange: [0, 0, 1, 1]
    });

    const orbitRotateCWInterpolate = orbitRotateCW.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const orbitRotateCCWInterpolate = orbitRotateCCW.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg']
    });

    return (
        <LinearGradient colors={['#0F0B20', '#05030A']} style={styles.container}>
            <SoundEffects ref={soundRef} />
            
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerLeftButton} 
                    onPress={() => navigation.navigate('Home')}
                >
                    <Ionicons name="chevron-back" size={24} color="#00F2FE" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerSubtitle}>CYBER ARENA</Text>
                    <Text style={styles.headerTitle} numberOfLines={1}>{className}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Sub-Header tag showing active exam */}
            {activeExam && !loading && (
                <View style={styles.activeExamTagContainer}>
                    <Text style={styles.activeExamLabel}>ACTIVE EXAM: </Text>
                    <Text style={styles.activeExamName}>{activeExam.exam_name}</Text>
                </View>
            )}

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF6A00" />
                    <Text style={styles.loadingText}>SYNCHRONIZING SCENARIO...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {leaderboard.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="flash-outline" size={48} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyStateText}>No ranking metrics published for this class.</Text>
                        </View>
                    ) : (
                        <View style={styles.arena}>
                                {leaderboard.map((student) => {
                                    const isGold = student.rank === 1;
                                    const isSilver = student.rank === 2;
                                    const isBronze = student.rank === 3;
                                    const isTop3 = student.rank <= 3;
                                    
                                    let tierBorderColor = 'rgba(0, 168, 255, 0.3)';
                                    let rankLevelText = 'Other';
                                    let rowColors = ['rgba(12, 10, 28, 0.85)', 'rgba(12, 10, 28, 0.85)'];
                                    
                                    let detailsBg = 'rgba(5, 3, 15, 0.8)';
                                    let detailsBorder = '#00A8FF';
                                    let studentNameColor = '#FFFFFF';
                                    let rankLabelColor = '#00A8FF';
                                    let medallionBg = 'rgba(0, 0, 0, 0.4)';
                                    let medallionBorder = 'rgba(0, 168, 255, 0.3)';
                                    let medallionIconColor = '#00A8FF';
                                    let percentageValueColor = '#00A8FF';
                                    let avatarBorderColor = '#00A8FF';

                                    if (isGold) {
                                        tierBorderColor = '#FFD700';
                                        rankLevelText = 'Golden Avg';
                                        detailsBorder = '#FFD700';
                                        rankLabelColor = '#FFD700';
                                        medallionBorder = 'rgba(255, 215, 0, 0.3)';
                                        medallionIconColor = '#FFD700';
                                        percentageValueColor = '#FFD700';
                                        avatarBorderColor = '#FFD700';
                                    } else if (isSilver) {
                                        tierBorderColor = '#00F2FE';
                                        rankLevelText = 'Silver Avg';
                                        detailsBorder = '#00F2FE';
                                        rankLabelColor = '#00F2FE';
                                        medallionBorder = 'rgba(0, 242, 254, 0.3)';
                                        medallionIconColor = '#00F2FE';
                                        percentageValueColor = '#00F2FE';
                                        avatarBorderColor = '#00F2FE';
                                    } else if (isBronze) {
                                        tierBorderColor = '#FF7A00';
                                        rankLevelText = 'Bronze Avg';
                                        detailsBorder = '#FF7A00';
                                        rankLabelColor = '#FF7A00';
                                        medallionBorder = 'rgba(255, 122, 0, 0.3)';
                                        medallionIconColor = '#FF7A00';
                                        percentageValueColor = '#FF7A00';
                                        avatarBorderColor = '#FF7A00';
                                    }

                                    return (
                                        <TouchableOpacity 
                                            key={student.student_id}
                                            activeOpacity={0.8}
                                            onPress={() => handleRowClick(student)}
                                            style={[
                                                styles.rowOuterBorder, 
                                                { borderColor: tierBorderColor },
                                                isGold && { shadowColor: '#FFD700', shadowOpacity: 0.6, shadowRadius: 10 },
                                                isSilver && { shadowColor: '#00F2FE', shadowOpacity: 0.5, shadowRadius: 8 },
                                                isBronze && { shadowColor: '#FF7A00', shadowOpacity: 0.5, shadowRadius: 8 }
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={rowColors as [string, string]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.rowGradient}
                                            >
                                                {/* Column 1: Rank Box */}
                                                <View style={styles.rowRankCol}>
                                                    {isTop3 && (
                                                        <Text style={styles.rowCrownEmoji}>👑</Text>
                                                    )}
                                                    <Text style={[styles.rankBracketText, { color: percentageValueColor }]}>
                                                        [<Text style={styles.rankNumberText}>{student.rank}</Text>]
                                                    </Text>
                                                </View>

                                                {/* Column 2: Avatar */}
                                                <View style={styles.rowPhotoCol}>
                                                    {isGold && (
                                                        <Text style={styles.photoCrownEmoji}>👑</Text>
                                                    )}
                                                    <View style={[styles.rowPhotoFrame, { borderColor: avatarBorderColor }]}>
                                                        {student.photo_url ? (
                                                            <Image source={{ uri: student.photo_url }} style={styles.rowPhotoImg} />
                                                        ) : (
                                                            <View style={styles.rowPhotoPlaceholder}>
                                                                <Text style={styles.rowPhotoPlaceholderText}>{student.full_name.charAt(0)}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Column 3: Name & Rank Level Rectangular Text Box */}
                                                <View style={[styles.rowDetailsCol, { backgroundColor: detailsBg, borderColor: detailsBorder }]}>
                                                    <Text style={[styles.detailsHeaderLabel, { color: rankLabelColor }]}>
                                                        STUDENT NAME
                                                    </Text>
                                                    <Text style={[styles.rowStudentName, { color: studentNameColor }]} numberOfLines={1}>
                                                        {student.full_name.toUpperCase()}
                                                     </Text>
                                                    <Text style={[styles.rowRankLabel, { color: rankLabelColor }]}>
                                                        {rankLevelText} • {student.rank <= 3 ? 'ELITE I' : 'CHAMP II'}
                                                    </Text>
                                                </View>

                                                {/* Column 4: Medallion */}
                                                <View style={styles.rowBadgeCol}>
                                                    <View style={styles.medallionWrapper}>
                                                        <View style={[styles.rowMedallion, { backgroundColor: medallionBg, borderColor: medallionBorder }]}>
                                                            <Ionicons name="ribbon" size={12} color={medallionIconColor} />
                                                        </View>
                                                        <Text style={[styles.medallionLabel, { color: rankLabelColor }]}>MASTER RANK</Text>
                                                    </View>
                                                </View>

                                                {/* Column 5: Percentage */}
                                                <View style={styles.rowPercentageCol}>
                                                    <Text style={[styles.percentageBracketText, { color: percentageValueColor }]}>
                                                        [<Text style={styles.percentageValueText}>{student.avgMarks}</Text>]%
                                                    </Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* 3D Throw Card Popup Overlay Modal */}
            <Modal
                transparent
                visible={selectedStudent !== null}
                onRequestClose={handleCloseCard}
                animationType="none"
            >
                {selectedStudent && (() => {
                    const rankStyles = getCardRankStyles(selectedStudent.rank);
                    return (
                        <Animated.View style={[styles.cardOverlay, { opacity: overlayOpacity }]}>
                            <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseCard} />
                            
                            <Animated.View style={[
                                styles.throwCardContainer, 
                                { 
                                    transform: [
                                        { scale: cardScale }
                                    ]
                                }
                            ]}>
                                <Pressable onPress={handleCardFlip} style={{ width: '100%', height: '100%' }}>
                                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        {/* Front Side */}
                                        <Animated.View style={[
                                            styles.throwCardSide,
                                            styles.throwCardFront,
                                            { 
                                                opacity: frontOpacity,
                                                transform: [
                                                    { perspective: 1000 },
                                                    { rotateY: frontRotate }
                                                ]
                                            }
                                        ]}>
                                            <View style={[styles.cardExoskeleton, { borderColor: rankStyles.borderColor, shadowColor: rankStyles.borderColor, backgroundColor: rankStyles.panelBg }]}>
                                                <Image source={require('../../../assets/images/hacker_card.png')} style={[StyleSheet.absoluteFillObject, { tintColor: rankStyles.tintColor }]} resizeMode="stretch" />
                                                
                                                {/* Portrait frame */}
                                                <View style={[styles.hackerPortraitContainer, { borderColor: rankStyles.borderColor }]}>
                                                    <Text style={[styles.hackerTagCircuit, { borderColor: rankStyles.borderColor, color: rankStyles.textColor, backgroundColor: rankStyles.circuitBg }]}>CIRCUIT</Text>
                                                    {selectedStudent.photo_url ? (
                                                        <View style={{ width: '100%', height: '100%' }}>
                                                            <Image source={{ uri: selectedStudent.photo_url }} style={styles.hackerPortraitImg} />
                                                        </View>
                                                    ) : (
                                                        <View style={[styles.hackerPortraitPlaceholder, { backgroundColor: '#021a05' }]}>
                                                            <Text style={[styles.hackerPortraitPlaceholderText, { color: rankStyles.textColor }]}>{selectedStudent.full_name.charAt(0)}</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Name banner cover */}
                                                <View style={[styles.hackerNameBanner, { backgroundColor: rankStyles.panelBg, borderColor: rankStyles.borderColor }]}>
                                                    <Text style={[styles.hackerNameText, { color: rankStyles.textColor }]}>{selectedStudent.full_name.toUpperCase()}</Text>
                                                    <Text style={[styles.hackerSubText, { color: rankStyles.subTextColor }]}>{className.toUpperCase()}</Text>
                                                </View>

                                                {/* Stats Grid Display */}
                                                <View style={[styles.hackerTerminalDisplay, { backgroundColor: rankStyles.panelBg, borderColor: rankStyles.statBoxBorder }]}>
                                                    <View style={styles.hackerStatsGrid}>
                                                        <View style={[styles.hackerStatBox, { borderColor: rankStyles.statBoxBorder }]}>
                                                            <Text style={[styles.hackerStatLabel, { color: rankStyles.textColor }]}>RANK</Text>
                                                            <Text style={styles.hackerStatValue}>#{selectedStudent.rank}</Text>
                                                        </View>
                                                        <View style={[styles.hackerStatBox, { borderColor: rankStyles.statBoxBorder }]}>
                                                            <Text style={[styles.hackerStatLabel, { color: rankStyles.textColor }]}>AVG</Text>
                                                            <Text style={styles.hackerStatValue}>{selectedStudent.avgMarks}%</Text>
                                                        </View>
                                                        <View style={[styles.hackerStatBox, { borderColor: rankStyles.statBoxBorder }]}>
                                                            <Text style={[styles.hackerStatLabel, { color: rankStyles.textColor }]}>TIER</Text>
                                                            <Text style={[styles.hackerStatValue, { fontSize: 10 }]}>
                                                                {selectedStudent.rank === 1 ? 'ELITE' : selectedStudent.rank <= 3 ? 'ACE' : 'CHAMP'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.hackerStatusLine, { color: rankStyles.textColor }]}>
                                                        STATUS :: {selectedStudent.rank <= 3 ? `[ ACTIVE // ELITE I ]` : `[ ACTIVE // CHAMP II ]`}
                                                    </Text>
                                                </View>
                                            </View>
                                        </Animated.View>

                                        {/* Back Side */}
                                        <Animated.View style={[
                                            styles.throwCardSide,
                                            styles.throwCardBack,
                                            { 
                                                opacity: backOpacity,
                                                transform: [
                                                    { perspective: 1000 },
                                                    { rotateY: backRotate }
                                                ]
                                            }
                                        ]}>
                                            <View style={[styles.cardExoskeleton, { borderColor: rankStyles.borderColor, shadowColor: rankStyles.borderColor, backgroundColor: rankStyles.panelBg }]}>
                                                <Image source={require('../../../assets/images/hacker_card.png')} style={[StyleSheet.absoluteFillObject, { tintColor: rankStyles.tintColor }]} resizeMode="stretch" />

                                                {/* Decrypted terminal cover overlay */}
                                                <View style={[styles.cardBackTerminal, { backgroundColor: rankStyles.panelBg, borderColor: rankStyles.statBoxBorder }]}>
                                                    <Text style={styles.terminalCodeLine}><Text style={styles.codeBracket}>[ SYSTEM CORE // SUBJECT MARKS ]</Text></Text>
                                                    <ScrollView style={{ flex: 1, width: '100%', marginVertical: 4 }} showsVerticalScrollIndicator={false}>
                                                        {selectedStudent.subjects.map((sub, i) => (
                                                            <Text key={i} style={[styles.terminalCodeLine, { color: rankStyles.textColor }]}>
                                                                {sub.subject_code.toUpperCase()}_MKS = {sub.marks_obtained} / {sub.max_marks} <Text style={styles.codeComment}>[{sub.grade}]</Text>
                                                            </Text>
                                                        ))}
                                                    </ScrollView>
                                                    <Text style={[styles.terminalCodeLine, { marginTop: 6 }]}><Text style={styles.codeBracket}>[ DECRYPT COMPLETE // STATUS: PASS ]</Text></Text>
                                                    <Text style={[styles.hackerTapHint, { color: rankStyles.subTextColor }]}>[TAP CARD // DECRYPT FRONT]</Text>
                                                </View>
                                            </View>
                                        </Animated.View>
                                    </View>
                                </Pressable>
                            </Animated.View>

                            <TouchableOpacity style={styles.closeOverlayBtn} onPress={handleCloseCard}>
                                <Text style={styles.closeOverlayBtnText}>✕ CLOSE CARD</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })()}
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        paddingTop: 60, 
        paddingHorizontal: 15, 
        paddingBottom: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    headerLeftButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerSubtitle: { color: '#FF6A00', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
    headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#FF6A00', fontSize: 13, marginTop: 15, letterSpacing: 2, fontWeight: '600' },
    scrollContent: { paddingBottom: 100, paddingHorizontal: 15 },
    activeExamTagContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 106, 0, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 106, 0, 0.3)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        marginBottom: 15,
        alignSelf: 'center'
    },
    activeExamLabel: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '800' },
    activeExamName: { color: '#FFD700', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    emptyState: { alignItems: 'center', padding: 80, marginTop: 40 },
    emptyStateText: { color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', fontSize: 14, marginTop: 12, lineHeight: 20 },
    arena: { 
        marginTop: 10,
        backgroundColor: 'rgba(20, 10, 35, 0.85)',
        borderWidth: 2,
        borderColor: '#FF6A00',
        borderRadius: 24,
        padding: 16
    },

    // Row styles
    rowOuterBorder: {
        borderWidth: 1.5,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden'
    },
    rowGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16
    },
    rowRankCol: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center'
    },
    badgeCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '900',
        fontStyle: 'italic'
    },
    rankNumNormal: {
        fontSize: 16,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)'
    },
    rowPhotoCol: {
        width: 54,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rowPhotoFrame: {
        width: 42,
        height: 42,
        borderRadius: 8,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    rowPhotoImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    rowPhotoPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    rowPhotoPlaceholderText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },
    rowDetailsCol: {
        flex: 2.2,
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 10
    },
    rowRankLabel: {
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    rowStudentName: {
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2
    },
    rowBadgeCol: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rowMedallion: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 10,
        gap: 4
    },
    medallionValue: {
        fontSize: 9,
        fontWeight: '700'
    },
    rowPercentageCol: {
        flex: 1.2,
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    percentageLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 7,
        fontWeight: '600'
    },
    percentageValue: {
        fontSize: 16,
        fontWeight: '900'
    },
    rowCrownEmoji: {
        position: 'absolute',
        top: -10,
        fontSize: 14,
        zIndex: 10
    },
    photoCrownEmoji: {
        position: 'absolute',
        top: -12,
        fontSize: 14,
        zIndex: 10
    },
    rankBracketText: {
        fontSize: 20,
        fontWeight: '300',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    rankNumberText: {
        fontWeight: '900',
        fontSize: 22
    },
    percentageBracketText: {
        fontSize: 18,
        fontWeight: '300',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    percentageValueText: {
        fontWeight: '900',
        fontSize: 20
    },
    detailsHeaderLabel: {
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 2
    },
    medallionWrapper: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    medallionLabel: {
        fontSize: 5,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginTop: 3,
        letterSpacing: 0.2
    },

    // 3D Throw Card Popup Overlay Modal
    cardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(3, 2, 7, 0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    throwCardContainer: {
        width: 250,
        height: 572,
    },
    throwCardSide: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backfaceVisibility: 'hidden'
    },
    throwCardFront: {
        zIndex: 2
    },
    throwCardBack: {
        zIndex: 1
    },
    cardExoskeleton: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00ff66',
        backgroundColor: '#020904',
        position: 'relative',
        shadowColor: '#00ff66',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    hackerPortraitContainer: {
        position: 'absolute',
        top: '5.6%',
        left: '8.5%',
        width: '83%',
        height: '57.8%',
        borderWidth: 1.5,
        borderColor: '#00ff66',
        borderRadius: 4,
        overflow: 'hidden',
    },
    hackerTagCircuit: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0, 255, 102, 0.25)',
        borderWidth: 1,
        borderColor: '#00ff66',
        color: '#00ff66',
        fontSize: 8,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 2,
        zIndex: 5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    hackerPortraitImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.95
    },
    hackerPortraitPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    hackerPortraitPlaceholderText: {
        fontSize: 54,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    hackerNameBanner: {
        position: 'absolute',
        top: '64.5%',
        left: '9%',
        width: '82%',
        height: '13.5%',
        backgroundColor: 'rgba(0, 20, 5, 0.9)',
        borderWidth: 1.5,
        borderColor: '#00ff66',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4
    },
    hackerNameText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#00ff66',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 1
    },
    hackerSubText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 2
    },
    hackerTerminalDisplay: {
        position: 'absolute',
        top: '79.5%',
        left: '9%',
        width: '82%',
        height: '15.5%',
        backgroundColor: 'rgba(0, 8, 2, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 102, 0.3)',
        borderRadius: 4,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardBackTerminal: {
        position: 'absolute',
        top: '5.6%',
        left: '8.5%',
        width: '83%',
        height: '89.5%',
        backgroundColor: 'rgba(0, 8, 2, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 102, 0.3)',
        borderRadius: 4,
        padding: 12,
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
    },
    terminalCodeLine: {
        fontSize: 10,
        color: '#00ff66',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        lineHeight: 14,
        marginBottom: 2
    },
    codeBracket: {
        color: '#ffd700',
        fontWeight: 'bold'
    },
    codeComment: {
        color: 'rgba(0, 255, 102, 0.5)',
        fontStyle: 'italic'
    },
    hackerTapHint: {
        fontSize: 8,
        color: 'rgba(0, 255, 102, 0.4)',
        textAlign: 'center',
        letterSpacing: 1,
        width: '100%',
        marginTop: 6,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    closeOverlayBtn: {
        backgroundColor: 'rgba(255, 106, 0, 0.15)',
        borderWidth: 2,
        borderColor: '#FF6A00',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 20
    },
    closeOverlayBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1
    },
    hackerStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        marginBottom: 4,
        width: '100%',
    },
    hackerStatBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 8, 2, 0.4)',
    },
    hackerStatLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    hackerStatValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffffff',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 1,
    },
    hackerStatusLine: {
        fontSize: 8,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textAlign: 'center',
        letterSpacing: 0.5,
    }
});
