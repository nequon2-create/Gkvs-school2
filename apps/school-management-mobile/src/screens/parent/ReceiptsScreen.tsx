import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { FeeReceipt } from '../../types';

export default function ReceiptsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { studentId } = route.params;

    const [loading, setLoading] = useState(true);
    const [receipts, setReceipts] = useState<FeeReceipt[]>([]);

    const fetchReceipts = async () => {
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
                    <Text style={styles.receiptNoText}>#{item.receipt_number}</Text>
                </View>
                <Text style={styles.receiptDate}>
                    {new Date(item.receipt_date).toLocaleDateString('en-IN')}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Paid</Text>
                    <Text style={styles.paidValue}>₹{item.amount_paid.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Payment Mode</Text>
                    <Text style={styles.value}>{item.payment_mode}</Text>
                </View>
                {item.amount_pending > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Pending Balance</Text>
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
                <TouchableOpacity style={styles.viewBtn}>
                    <Ionicons name="download-outline" size={18} color="#4F63AC" />
                    <Text style={styles.viewBtnText}>Receipt</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A202C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fee Receipts</Text>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4F63AC" />
                </View>
            ) : receipts.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="receipt-outline" size={64} color="#CBD5E0" />
                    <Text style={styles.emptyText}>No receipts found</Text>
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A202C' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#A0AEC0', marginTop: 12 },
    list: { padding: 16 },
    receiptCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    receiptNoBadge: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    receiptNoText: { fontSize: 13, fontWeight: '700', color: '#4F63AC' },
    receiptDate: { fontSize: 14, color: '#718096' },
    cardBody: { gap: 10, marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 14, color: '#718096' },
    value: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
    paidValue: { fontSize: 16, fontWeight: '700', color: '#2F855A' },
    pendingValue: { fontSize: 15, fontWeight: '600', color: '#C53030' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusPaid: { backgroundColor: '#F0FDF4' },
    statusPartial: { backgroundColor: '#FFFBEB' },
    statusText: { fontSize: 12, fontWeight: '700' },
    statusTextPaid: { color: '#16A34A' },
    statusTextPartial: { color: '#D69E2E' },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4F63AC',
    },
    viewBtnText: { fontSize: 13, fontWeight: '600', color: '#4F63AC' },
});
