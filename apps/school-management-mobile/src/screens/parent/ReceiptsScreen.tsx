import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { FeeReceipt } from '../../types';

export default function ReceiptsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuthStore();
    
    // Fallback: If studentId is not in route params, fetch using the logged-in student's id
    const studentId = route.params?.studentId ?? user?.id;

    const [loading, setLoading] = useState(true);
    const [receipts, setReceipts] = useState<FeeReceipt[]>([]);

    const fetchReceipts = async () => {
        if (!studentId) {
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('fee_receipts')
                .select('*')
                .eq('student_id', studentId)
                .order('receipt_date', { ascending: false });

            if (error) throw error;
            setReceipts(data || []);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [studentId]);

    const renderReceiptItem = ({ item }: { item: FeeReceipt }) => (
        <View style={styles.receiptCard}>
            <View style={styles.cardHeader}>
                <View style={styles.receiptNoBadge}>
                    <Text style={styles.receiptNoText}>Receipt #{item.receipt_number}</Text>
                </View>
                <Text style={styles.receiptDate}>
                    {new Date(item.receipt_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Paid</Text>
                    <Text style={styles.paidValue}>₹{item.amount_paid.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Payment Method</Text>
                    <Text style={styles.value}>{item.payment_mode}</Text>
                </View>
                {item.amount_pending > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Outstanding Balance</Text>
                        <Text style={styles.pendingValue}>₹{item.amount_pending.toLocaleString('en-IN')}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View style={[
                    styles.statusBadge,
                    item.payment_status === 'Paid' ? styles.statusPaid : styles.statusPartial
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.payment_status === 'Paid' ? styles.statusTextPaid : styles.statusTextPartial
                    ]}>
                        {item.payment_status}
                    </Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={() => alert('Downloading receipt PDF...')}>
                    <Ionicons name="download-outline" size={16} color="#C084FC" />
                    <Text style={styles.downloadBtnText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Fee Receipts</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#A855F7" />
                    </View>
                ) : receipts.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.15)" />
                        <Text style={styles.emptyText}>No receipts found for this student</Text>
                    </View>
                ) : (
                    <FlatList
                        data={receipts}
                        renderItem={renderReceiptItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 12 : 6,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 12 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    receiptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 16,
        marginBottom: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    receiptNoBadge: {
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    receiptNoText: { fontSize: 11, fontWeight: '700', color: '#C084FC' },
    receiptDate: { fontSize: 13, color: 'rgba(255, 255, 255, 0.4)' },
    cardBody: { gap: 10, marginBottom: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
    value: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    paidValue: { fontSize: 15, fontWeight: '700', color: '#34D399' },
    pendingValue: { fontSize: 14, fontWeight: '600', color: '#FBBF24' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusPaid: { backgroundColor: 'rgba(52, 211, 153, 0.12)' },
    statusPartial: { backgroundColor: 'rgba(251, 191, 36, 0.12)' },
    statusText: { fontSize: 11, fontWeight: '700' },
    statusTextPaid: { color: '#34D399' },
    statusTextPartial: { color: '#FBBF24' },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
    },
    downloadBtnText: { fontSize: 12, fontWeight: '700', color: '#C084FC' },
});
