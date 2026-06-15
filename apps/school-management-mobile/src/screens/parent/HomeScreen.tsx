import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
    StatusBar, ActivityIndicator, Image, Modal, Dimensions, Platform, Linking, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Event, StudentFee } from '../../types';
import MarksCard from '../../components/MarksCard';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

type TeacherPreview = { id: string; full_name: string; subjects: string[] | null; photo_url: string | null; qualification: string | null };

export default function ParentHomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const scrollViewRef = useRef<ScrollView>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feeInfo, setFeeInfo] = useState<StudentFee | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [homework, setHomework] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<TeacherPreview[]>([]);
    const [attendancePercent, setAttendancePercent] = useState<number>(100);
    const [academicStatusPercent, setAcademicStatusPercent] = useState<number>(100);
    const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
    const [myRatings, setMyRatings] = useState<Record<string, number>>({});
    
    // Y offsets for scrolling
    const [homeworkY, setHomeworkY] = useState(0);
    const [eventsY, setEventsY] = useState(0);

    // Accordion Expansion State
    const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    // Modal State
    const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [showMarksCard, setShowMarksCard] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);

    // Fee Reminder Popup States
    const [activeFeeAlert, setActiveFeeAlert] = useState<{
        pendingAmount: number;
        studentName: string;
        regNo: string;
        frequency: string;
    } | null>(null);
    const [alertDismissCountdown, setAlertDismissCountdown] = useState(5);
    const [showUPIInstructions, setShowUPIInstructions] = useState(false);

    const fetchData = async () => {
        try {
            if (user?.id) {
                // Fetch student photo
                const { data: studentData } = await supabase
                    .from('students')
                    .select('photo_url')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (studentData?.photo_url) {
                    setStudentPhoto(studentData.photo_url);
                }

                // Fetch attendance metrics
                const { count: presentCount } = await supabase
                    .from('student_attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', user.id)
                    .eq('is_present', true);

                const { count: totalCount } = await supabase
                    .from('student_attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', user.id);

                const attPercent = totalCount ? Math.round((presentCount ?? 0) / totalCount * 100) : 95;
                setAttendancePercent(attPercent);

                // Fetch student marks to calculate overall marks average
                const { data: studentMarks, error: marksError } = await supabase
                    .from('marks')
                    .select('marks_obtained, max_marks')
                    .eq('student_id', user.id);

                let marksAverage = 100;
                let hasMarks = false;
                if (!marksError && studentMarks && studentMarks.length > 0) {
                    const totalObtained = studentMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
                    const totalMax = studentMarks.reduce((sum, m) => sum + (m.max_marks || 100), 0);
                    if (totalMax > 0) {
                        marksAverage = Math.round((totalObtained / totalMax) * 100);
                        hasMarks = true;
                    }
                }

                // Combined Average of Attendance and Marks
                const finalCombined = hasMarks ? Math.round((attPercent + marksAverage) / 2) : attPercent;
                setAcademicStatusPercent(finalCombined);

                // Get current academic year ID first
                const { data: yearData } = await supabase
                    .from('academic_years')
                    .select('id')
                    .eq('is_current', true)
                    .single();

                // Fetch fee info
                let { data: fees } = await supabase
                    .from('student_fees')
                    .select('*')
                    .eq('student_id', user.id)
                    .eq('academic_year_id', yearData?.id)
                    .limit(1);

                if (!fees || fees.length === 0) {
                    const { data: fallbackFees } = await supabase
                        .from('student_fees')
                        .select('*')
                        .eq('student_id', user.id)
                        .order('updated_at', { ascending: false })
                        .limit(1);
                    fees = fallbackFees;
                }

                if (fees && fees.length > 0) {
                    const feeRecord = fees[0];
                    setFeeInfo(feeRecord);

                    // Check active fee alerts
                    const pendingAmount = feeRecord.amount_pending ?? feeRecord.pending_amount ?? 0;
                    if (feeRecord.alert_active && pendingAmount > 0) {
                        let shouldShow = false;
                        const lastShown = feeRecord.alert_last_shown_at ? new Date(feeRecord.alert_last_shown_at) : null;
                        const now = new Date();

                        if (!lastShown) {
                            shouldShow = true;
                        } else if (feeRecord.alert_frequency === 'always') {
                            shouldShow = true;
                        } else if (feeRecord.alert_frequency === 'daily') {
                            const diffHours = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
                            if (diffHours >= 24) shouldShow = true;
                        } else if (feeRecord.alert_frequency === 'weekly') {
                            const diffDays = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24);
                            if (diffDays >= 7) shouldShow = true;
                        } else if (feeRecord.alert_frequency === 'once') {
                            shouldShow = true;
                        }

                        if (shouldShow) {
                            setActiveFeeAlert({
                                pendingAmount: pendingAmount,
                                studentName: user.full_name,
                                regNo: user.registration_number || '',
                                frequency: feeRecord.alert_frequency
                            });
                            
                            // Set Countdown to 5
                            setAlertDismissCountdown(5);

                            // Update Database timestamp and alert_active toggle
                            await supabase
                                .from('student_fees')
                                .update({
                                    alert_last_shown_at: now.toISOString(),
                                    alert_active: feeRecord.alert_frequency === 'once' ? false : true
                                })
                                .eq('id', feeRecord.id);
                        }
                    }
                } else {
                    setFeeInfo(null);
                }
            }

            // Fetch recent homework
            if (user?.class_id) {
                const { data: hwData } = await supabase
                    .from('homework')
                    .select('*, teachers(id, full_name, photo_url, subjects)')
                    .eq('class_id', user.class_id)
                    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(3);
                setHomework(hwData ?? []);
            }

            // Fetch upcoming events
            const today = new Date().toISOString().split('T')[0];
            const { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .gte('date', today)
                .order('date', { ascending: true })
                .limit(3);
            setEvents(eventsData ?? []);

            // Fetch teachers
            const { data: teachersData } = await supabase
                .from('teachers')
                .select('id, full_name, subjects, photo_url, qualification')
                .order('full_name', { ascending: true });

            setTeachers(teachersData ?? []);

            if (user?.id) {
                const currentMonth = new Date().toISOString().substring(0, 7);
                const { data: ratingsData } = await supabase
                    .from('teacher_ratings')
                    .select('teacher_id, rating')
                    .eq('parent_id', user.id)
                    .eq('rating_month', currentMonth);
                
                const ratingsMap: Record<string, number> = {};
                if (ratingsData) {
                    ratingsData.forEach((r: any) => {
                        ratingsMap[r.teacher_id] = r.rating;
                    });
                }
                setMyRatings(ratingsMap);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Countdown Timer logic for Fee Popup
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (activeFeeAlert && alertDismissCountdown > 0 && !showUPIInstructions) {
            interval = setInterval(() => {
                setAlertDismissCountdown(prev => prev - 1);
            }, 1000);
        } else if (alertDismissCountdown === 0 && activeFeeAlert && !showUPIInstructions) {
            setActiveFeeAlert(null);
            setShowUPIInstructions(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeFeeAlert, alertDismissCountdown, showUPIInstructions]);

    const closeFeeAlert = () => {
        setActiveFeeAlert(null);
        setShowUPIInstructions(false);
    };

    const handleUPIPay = () => {
        if (!activeFeeAlert) return;
        const note = `Fee_Payment_${activeFeeAlert.studentName.trim().replace(/\s+/g, '_')}_Reg_${activeFeeAlert.regNo}`;
        const upiUrl = `upi://pay?pa=9900282804@ybl&pn=SIDDARAM%20MUGALIN&am=${activeFeeAlert.pendingAmount}&cu=INR&tn=${note}`;
        
        Linking.canOpenURL(upiUrl)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(upiUrl);
                } else {
                    alert('No UPI application found on this device. Please install Google Pay, PhonePe, or Paytm.');
                }
            })
            .catch((err) => console.error('UPI Pay link error:', err));
    };

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleRateTeacher = async (teacherId: string, ratingValue: number) => {
        if (!user?.id) return;
        
        try {
            const currentMonth = new Date().toISOString().substring(0, 7);
            
            // Upsert the rating
            const { error } = await supabase
                .from('teacher_ratings')
                .upsert({
                    parent_id: user.id,
                    teacher_id: teacherId,
                    rating: ratingValue,
                    rating_month: currentMonth
                }, {
                    onConflict: 'parent_id,teacher_id,rating_month'
                });
                
            if (error) throw error;
            
            // Update local state
            setMyRatings(prev => ({
                ...prev,
                [teacherId]: ratingValue
            }));
            
            Alert.alert('Thank You', 'Your rating has been submitted successfully!');
        } catch (err: any) {
            console.error('Error rating teacher:', err);
            Alert.alert('Error', err.message || 'Failed to submit rating. Please try again.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    const getAcademicStatusMessage = () => {
        if (academicStatusPercent >= 90) return 'Outstanding academic performance! Keep it up!';
        if (academicStatusPercent >= 80) return 'Excellent status. Doing great!';
        if (academicStatusPercent >= 60) return 'Good progress. Focus on continuing to improve!';
        return 'Needs improvement. Focus on study and class attendance.';
    };

    const pendingAmount = feeInfo?.amount_pending ?? 0;
    const size = 68;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (academicStatusPercent / 100) * circumference;

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            <ScrollView
                ref={scrollViewRef}
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.avatarBorder}>
                            <View style={styles.avatarInner}>
                                {studentPhoto ? (
                                    <Image source={{ uri: studentPhoto }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {user?.full_name?.charAt(0).toUpperCase() ?? 'S'}
                                    </Text>
                                )}
                            </View>
                        </LinearGradient>
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.greeting}>Welcome Back</Text>
                            <Text style={styles.userName} numberOfLines={1}>{user?.full_name}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.bellButton} activeOpacity={0.8} onPress={() => alert('No new notifications')}>
                        <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                        {pendingAmount > 0 && <View style={styles.bellBadge} />}
                    </TouchableOpacity>
                </View>

                {/* Hero / Personalized Overview Card */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroHeader}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.sessionBadge}>
                                <Text style={styles.sessionBadgeText}>STUDENT PROFILE</Text>
                            </View>
                            <Text style={styles.heroTitle}>Academic Status</Text>
                            <Text style={styles.heroSubtitle}>Class: {user?.class_id ? 'Active' : 'Unassigned'}</Text>
                        </View>
                        <View style={styles.progressContainer}>
                            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                                <Defs>
                                    <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor="#A855F7" />
                                        <Stop offset="100%" stopColor="#E9D5FF" />
                                    </SvgLinearGradient>
                                </Defs>
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="rgba(255, 255, 255, 0.05)"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                />
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="url(#grad)"
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </Svg>
                            <View style={styles.progressTextContainer}>
                                <Text style={styles.progressPercentText}>{academicStatusPercent}%</Text>
                                <Text style={styles.progressLabelText}>Status</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.heroFooter}>
                        <Text style={styles.attendanceSummary} numberOfLines={1}>
                            {getAcademicStatusMessage()}
                        </Text>
                        <TouchableOpacity
                            style={styles.heroButton}
                            activeOpacity={0.8}
                            onPress={() => setShowMarksCard(true)}
                        >
                            <Text style={styles.heroButtonText}>View Performance</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* 2x2 Grid Recommended for You */}
                <Text style={styles.sectionHeaderTitle}>Recommended for You</Text>
                <View style={styles.gridContainer}>
                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => setShowMarksCard(true)}
                    >
                        <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'rgba(0,0,0,0)']} style={styles.gridCardGradient}>
                            <View style={[styles.iconCircle, { borderColor: 'rgba(168, 85, 247, 0.4)' }]}>
                                <Ionicons name="bar-chart" size={24} color="#C084FC" />
                            </View>
                            <Text style={styles.gridTitle}>Exam Marks</Text>
                            <Text style={styles.gridSubtitle}>Performance</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => setShowFeeModal(true)}
                    >
                        <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(0,0,0,0)']} style={styles.gridCardGradient}>
                            <View style={[styles.iconCircle, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                                <Ionicons name="wallet" size={24} color="#34D399" />
                            </View>
                            <Text style={styles.gridTitle}>Fee Status</Text>
                            <Text style={styles.gridSubtitle}>
                                {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString()}` : 'Fully Paid'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ParentHomework')}
                    >
                        <LinearGradient colors={['rgba(245, 158, 11, 0.15)', 'rgba(0,0,0,0)']} style={styles.gridCardGradient}>
                            <View style={[styles.iconCircle, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                                <Ionicons name="book" size={24} color="#FBBF24" />
                            </View>
                            <Text style={styles.gridTitle}>Homework</Text>
                            <Text style={styles.gridSubtitle}>{homework.length} pending</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.gridCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Events')}
                    >
                        <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(0,0,0,0)']} style={styles.gridCardGradient}>
                            <View style={[styles.iconCircle, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                                <Ionicons name="calendar" size={24} color="#60A5FA" />
                            </View>
                            <Text style={styles.gridTitle}>Events</Text>
                            <Text style={styles.gridSubtitle}>{events.length} upcoming</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Teachers Section */}
                <Text style={styles.sectionHeaderTitle}>👩‍🏫 Teachers</Text>
                {teachers.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={32} color="rgba(255, 255, 255, 0.2)" />
                        <Text style={styles.emptyText}>No teacher listings found</Text>
                    </View>
                ) : (
                    teachers.map((teacher) => (
                        <View key={teacher.id} style={styles.listCard}>
                            <View style={styles.listCardHeader}>
                                <View style={styles.teacherAvatarHome}>
                                    {teacher.photo_url ? (
                                        <Image source={{ uri: teacher.photo_url }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>
                                            {teacher.full_name?.charAt(0).toUpperCase() ?? 'T'}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.listCardTitle} numberOfLines={1}>{teacher.full_name}</Text>
                                    <Text style={styles.listCardSubtitle} numberOfLines={1}>
                                        {(teacher.subjects ?? []).join(', ') || 'Teacher'}
                                    </Text>
                                    {teacher.qualification && (
                                        <Text style={styles.qualificationText}>{teacher.qualification}</Text>
                                    )}
                                </View>
                            </View>
                            
                            {/* Stars rating row */}
                            <View style={styles.ratingRow}>
                                <Text style={styles.ratingLabel}>Rate Teacher:</Text>
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((starIndex) => {
                                        const currentRating = myRatings[teacher.id] || 0;
                                        const isFilled = starIndex <= currentRating;
                                        return (
                                            <TouchableOpacity
                                                key={starIndex}
                                                activeOpacity={0.7}
                                                onPress={() => handleRateTeacher(teacher.id, starIndex)}
                                                style={styles.starTouch}
                                            >
                                                <Ionicons
                                                    name={isFilled ? "star" : "star-outline"}
                                                    size={20}
                                                    color={isFilled ? "#FBBF24" : "rgba(255,255,255,0.3)"}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Homework Details Modal */}
            <Modal
                visible={!!selectedHomework}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedHomework(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Homework Details</Text>
                            <TouchableOpacity onPress={() => setSelectedHomework(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {selectedHomework && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                                <Text style={styles.hwDetailTitle}>{selectedHomework.title}</Text>
                                <View style={styles.hwDetailBadgeRow}>
                                    <View style={styles.modalBadge}>
                                        <Ionicons name="calendar-outline" size={14} color="#C084FC" />
                                        <Text style={styles.modalBadgeText}>
                                            Due: {selectedHomework.due_date ? new Date(selectedHomework.due_date).toLocaleDateString('en-IN') : 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.modalBadge}>
                                        <Ionicons name="book-outline" size={14} color="#C084FC" />
                                        <Text style={styles.modalBadgeText}>
                                            {selectedHomework.subject_id || 'Subject'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Teacher Info */}
                                <View style={styles.teacherDetailCard}>
                                    <Text style={styles.teacherDetailLabel}>Assigned By</Text>
                                    <View style={styles.teacherDetailRow}>
                                        <View style={styles.teacherAvatarDetail}>
                                            {selectedHomework.teachers?.photo_url ? (
                                                <Image source={{ uri: selectedHomework.teachers.photo_url }} style={styles.avatarImage} />
                                            ) : (
                                                <Text style={styles.avatarText}>
                                                    {selectedHomework.teachers?.full_name?.charAt(0).toUpperCase() || 'T'}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.teacherDetailTextCol}>
                                            <Text style={styles.teacherDetailName}>{selectedHomework.teachers?.full_name || 'Admin'}</Text>
                                            <Text style={styles.teacherDetailSubject}>
                                                {selectedHomework.teachers?.subjects ? selectedHomework.teachers.subjects.join(', ') : 'Teacher'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {(selectedHomework as any).attachments && (selectedHomework as any).attachments.length > 0 && (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={styles.hwDetailDescTitle}>Attached Photo:</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => setFullScreenImage((selectedHomework as any).attachments[0])}
                                            style={styles.attachmentButton}
                                        >
                                            <Image source={{ uri: (selectedHomework as any).attachments[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={styles.hwDetailDescTitle}>Instructions:</Text>
                                <Text style={styles.hwDetailDesc}>{selectedHomework.description || 'No instructions provided.'}</Text>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Fee Details Bottom Sheet Modal */}
            <Modal
                visible={showFeeModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFeeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Fee Details Breakdown</Text>
                            <TouchableOpacity onPress={() => setShowFeeModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalScroll}>
                            <Text style={styles.hwDetailTitle}>Academic Session Fees</Text>
                            
                            <View style={styles.feeBreakdownRow}>
                                <View style={styles.feeDetailItem}>
                                    <View style={[styles.listIconCircle, { backgroundColor: 'rgba(96, 165, 250, 0.1)', marginRight: 12 }]}>
                                        <Ionicons name="cash" size={18} color="#60A5FA" />
                                    </View>
                                    <View>
                                        <Text style={styles.feeDetailLabel}>Total Amount</Text>
                                        <Text style={styles.feeDetailValue}>₹{(feeInfo?.total_amount ?? 0).toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.feeBreakdownRow}>
                                <View style={styles.feeDetailItem}>
                                    <View style={[styles.listIconCircle, { backgroundColor: 'rgba(52, 211, 153, 0.1)', marginRight: 12 }]}>
                                        <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                                    </View>
                                    <View>
                                        <Text style={styles.feeDetailLabel}>Amount Paid</Text>
                                        <Text style={[styles.feeDetailValue, { color: '#34D399' }]}>₹{(feeInfo?.amount_paid ?? 0).toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.feeBreakdownRow}>
                                <View style={styles.feeDetailItem}>
                                    <View style={[styles.listIconCircle, { backgroundColor: pendingAmount > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)', marginRight: 12 }]}>
                                        <Ionicons name="alert-circle" size={18} color={pendingAmount > 0 ? '#FBBF24' : '#34D399'} />
                                    </View>
                                    <View>
                                        <Text style={styles.feeDetailLabel}>Amount Pending</Text>
                                        <Text style={[styles.feeDetailValue, { color: pendingAmount > 0 ? '#FBBF24' : '#34D399' }]}>₹{pendingAmount.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={{ marginTop: 12, gap: 12 }}>
                                {pendingAmount > 0 ? (
                                    <TouchableOpacity
                                        style={[styles.heroButton, { backgroundColor: '#A855F7', width: '100%', paddingVertical: 14, alignItems: 'center', borderRadius: 14 }]}
                                        activeOpacity={0.8}
                                        onPress={() => alert('Online payment gateway integration coming soon!')}
                                    >
                                        <Text style={[styles.heroButtonText, { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }]}>Pay Pending Fees</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.allPaidContainer}>
                                        <Ionicons name="ribbon" size={20} color="#34D399" />
                                        <Text style={styles.allPaidText}>All academic fees are fully paid!</Text>
                                    </View>
                                )}
                                
                                <TouchableOpacity
                                    style={[styles.heroButton, { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', paddingVertical: 14, alignItems: 'center', borderRadius: 14 }]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setShowFeeModal(false);
                                        navigation.navigate('Receipts');
                                    }}
                                >
                                    <Text style={[styles.heroButtonText, { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }]}>View Detailed Receipts</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Marks Card */}
            {user?.id && (
                <MarksCard
                    visible={showMarksCard}
                    studentId={user.id}
                    examId={null}
                    onClose={() => setShowMarksCard(false)}
                />
            )}

            {/* Full Screen Image Modal */}
            <Modal
                visible={fullScreenImage !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullScreenImage(null)}
            >
                <View style={styles.fullScreenImageContainer}>
                    <TouchableOpacity
                        style={styles.fullScreenCloseBtn}
                        onPress={() => setFullScreenImage(null)}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {fullScreenImage && (
                        <Image
                            source={{ uri: fullScreenImage }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* 5-Second Dismiss Fee Reminder Alert Overlay */}
            {activeFeeAlert && (
                <Modal
                    visible={!!activeFeeAlert}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeFeeAlert}
                >
                    <View style={styles.alertOverlay}>
                        <View style={styles.alertBox}>
                            {!showUPIInstructions ? (
                                <>
                                    <View style={styles.alertHeader}>
                                        <Ionicons name="warning" size={26} color="#FBBF24" />
                                        <Text style={styles.alertHeaderTitle}>FEE REMINDER</Text>
                                        <TouchableOpacity onPress={closeFeeAlert} style={styles.alertCloseBtn}>
                                            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.4)" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.alertBody}>
                                        <Text style={styles.alertMessageText}>
                                            Dear Parent, a fee balance of <Text style={styles.highlightAmount}>₹{activeFeeAlert.pendingAmount.toLocaleString('en-IN')}</Text> is pending for your child: <Text style={styles.highlightName}>{activeFeeAlert.studentName}</Text> (Reg No: {activeFeeAlert.regNo}).
                                        </Text>
                                        <Text style={styles.alertInstructions}>
                                            Please click pay below to copy details and open GPay/PhonePe to pay, or clear the dues at the office.
                                        </Text>

                                        <View style={styles.alertActionButtons}>
                                            <TouchableOpacity style={styles.alertPayNowBtn} onPress={() => setShowUPIInstructions(true)} activeOpacity={0.8}>
                                                <Ionicons name="wallet" size={16} color="#090514" style={{ marginRight: 6 }} />
                                                <Text style={styles.alertPayNowBtnText}>PAY VIA UPI</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.alertLaterBtn} onPress={closeFeeAlert}>
                                                <Text style={styles.alertLaterBtnText}>Pay Later</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Animated Countdown Progress Bar */}
                                    <View style={styles.progressTrackBar}>
                                        <View style={[styles.progressBarFill, { width: `${(alertDismissCountdown / 5) * 100}%` }]} />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.alertHeader}>
                                        <Ionicons name="wallet-outline" size={26} color="#34D399" />
                                        <Text style={[styles.alertHeaderTitle, { color: '#34D399' }]}>EASY UPI PAY</Text>
                                        <TouchableOpacity onPress={closeFeeAlert} style={styles.alertCloseBtn}>
                                            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.4)" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.alertBody}>
                                        <Text style={styles.alertMessageText}>
                                            Copy the details below, paste them into your UPI app, and pay:
                                        </Text>

                                        <View style={styles.upiInfoCard}>
                                            <View style={styles.upiRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.upiLabel}>PAY TO PHONE NUMBER</Text>
                                                    <Text style={styles.upiValue}>9900282804</Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={styles.copyButton}
                                                    onPress={async () => {
                                                        await Clipboard.setStringAsync('9900282804');
                                                        Alert.alert('Copied!', 'Phone number copied to clipboard.');
                                                    }}
                                                >
                                                    <Ionicons name="copy-outline" size={14} color="#34D399" />
                                                    <Text style={styles.copyButtonText}>Copy</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.upiRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.upiLabel}>AMOUNT TO PAY</Text>
                                                    <Text style={styles.upiValue}>₹{activeFeeAlert.pendingAmount.toLocaleString('en-IN')}</Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={styles.copyButton}
                                                    onPress={async () => {
                                                        await Clipboard.setStringAsync(activeFeeAlert.pendingAmount.toString());
                                                        Alert.alert('Copied!', 'Amount copied to clipboard.');
                                                    }}
                                                >
                                                    <Ionicons name="copy-outline" size={14} color="#34D399" />
                                                    <Text style={styles.copyButtonText}>Copy</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={[styles.upiRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.upiLabel}>UPI ID (ALTERNATE)</Text>
                                                    <Text style={styles.upiValue}>9900282804@ybl</Text>
                                                </View>
                                                <TouchableOpacity 
                                                    style={styles.copyButton}
                                                    onPress={async () => {
                                                        await Clipboard.setStringAsync('9900282804@ybl');
                                                        Alert.alert('Copied!', 'UPI ID copied to clipboard.');
                                                    }}
                                                >
                                                    <Ionicons name="copy-outline" size={14} color="#34D399" />
                                                    <Text style={styles.copyButtonText}>Copy</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <Text style={[styles.alertInstructions, { marginBottom: 6 }]}>
                                            Open UPI App below, select **Pay to Mobile Number** or **UPI ID**, paste details & pay:
                                        </Text>

                                        <View style={styles.upiAppButtonsGrid}>
                                            <TouchableOpacity style={styles.upiAppBtn} onPress={() => Linking.openURL('phonepe://')}>
                                                <Text style={styles.upiAppBtnText}>PhonePe</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.upiAppBtn} onPress={() => Linking.openURL('gpay://')}>
                                                <Text style={styles.upiAppBtnText}>Google Pay</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.upiAppBtn} onPress={() => Linking.openURL('paytm://')}>
                                                <Text style={styles.upiAppBtnText}>Paytm</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity 
                                            style={styles.alertBackBtn} 
                                            onPress={() => setShowUPIInstructions(false)}
                                        >
                                            <Text style={styles.alertBackBtnText}>Back to Alert</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 110 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090514' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarBorder: { width: 48, height: 48, borderRadius: 24, padding: 1.5, justifyContent: 'center', alignItems: 'center' },
    avatarInner: { width: '100%', height: '100%', borderRadius: 22, backgroundColor: '#1A152E', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    welcomeTextContainer: { justifyContent: 'center' },
    greeting: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
    userName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    bellButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    bellBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    heroCard: {
        borderRadius: 24, padding: 20, marginBottom: 28,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        alignSelf: 'flex-start', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
    },
    sessionBadgeText: { fontSize: 9, fontWeight: '700', color: '#C084FC', letterSpacing: 0.5 },
    heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    heroSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)', marginTop: 4 },
    progressContainer: { justifyContent: 'center', alignItems: 'center' },
    progressTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    progressPercentText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    progressLabelText: { fontSize: 8, color: 'rgba(255, 255, 255, 0.4)' },
    heroFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)'
    },
    attendanceSummary: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', flex: 1, marginRight: 12 },
    heroButton: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    heroButtonText: { fontSize: 12, fontWeight: '700', color: '#090514' },
    sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 12, marginBottom: 16 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
    gridCard: {
        width: (Dimensions.get('window').width - 52) / 2,
        borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    gridCardGradient: { padding: 16, gap: 12 },
    iconCircle: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)',
        justifyContent: 'center', alignItems: 'center',
    },
    gridTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    gridSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
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
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderRadius: 18, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 24, alignItems: 'center', gap: 8, marginBottom: 20,
    },
    emptyText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.3)' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#110D26', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
        maxHeight: '85%', paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    closeBtn: { padding: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20 },
    modalScroll: { padding: 20, gap: 16 },
    hwDetailTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
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
    teacherDetailTextCol: { flex: 1 },
    teacherDetailName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    teacherDetailSubject: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    hwDetailDescTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
    hwDetailDesc: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 22 },
    attachmentButton: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 8 },
    fullScreenImageContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullScreenCloseBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 8 },
    fullScreenImage: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
    
    // Fee Status breakdown specific styles
    feeBreakdownRow: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
        padding: 14, marginBottom: 10,
    },
    feeDetailItem: { flexDirection: 'row', alignItems: 'center' },
    feeDetailLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
    feeDetailValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
    allPaidContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingVertical: 14, borderRadius: 14,
    },
    allPaidText: { fontSize: 13, fontWeight: '700', color: '#34D399' },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#1C1534',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.25)',
        overflow: 'hidden',
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        gap: 10,
    },
    alertHeaderTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FBBF24',
        letterSpacing: 1.5,
        flex: 1,
    },
    alertCloseBtn: {
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    alertBody: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    alertMessageText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 22,
        fontWeight: '500',
    },
    highlightAmount: {
        color: '#EF4444',
        fontWeight: '800',
        fontSize: 15,
    },
    highlightName: {
        color: '#C084FC',
        fontWeight: '700',
    },
    alertInstructions: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 10,
        lineHeight: 16,
    },
    alertActionButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
    },
    alertPayNowBtn: {
        flex: 2,
        height: 44,
        backgroundColor: '#FBBF24',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertPayNowBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#090514',
        letterSpacing: 0.5,
    },
    alertLaterBtn: {
        flex: 1,
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    alertLaterBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    progressTrackBar: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FBBF24',
    },
    teacherAvatarHome: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    qualificationText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.04)'
    },
    ratingLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600'
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 6
    },
    starTouch: {
        padding: 2
    },
    upiInfoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 12,
        marginVertical: 12,
        gap: 12
    },
    upiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
        paddingBottom: 8
    },
    upiLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    upiValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginTop: 2
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        gap: 4
    },
    copyButtonText: {
        fontSize: 11,
        color: '#34D399',
        fontWeight: 'bold'
    },
    upiAppButtonsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginVertical: 12
    },
    upiAppBtn: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    upiAppBtnText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600'
    },
    alertBackBtn: {
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 4
    },
    alertBackBtnText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        textDecorationLine: 'underline'
    }
});
