import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, Image,
    TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';

interface AccountSwitcherModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function AccountSwitcherModal({ visible, onClose }: AccountSwitcherModalProps) {
    const { user, accounts, switchAccount, addAccount, removeAccount, updateAccountPhoto } = useAuthStore();
    
    // Sync missing/updated student photos from Supabase when modal opens
    useEffect(() => {
        if (visible && accounts.length > 0) {
            const syncAccountPhotos = async () => {
                try {
                    const accountIds = accounts.map((a) => a.id);
                    const { data } = await supabase
                        .from('students')
                        .select('id, photo_url')
                        .in('id', accountIds);

                    if (data && data.length > 0) {
                        for (const s of data) {
                            if (s.photo_url) {
                                await updateAccountPhoto(s.id, s.photo_url);
                            }
                        }
                    }
                } catch (err) {
                    console.log('Error syncing account photos:', err);
                }
            };
            syncAccountPhotos();
        }
    }, [visible]);

    // Mode: 'list' | 'add'
    const [mode, setMode] = useState<'list' | 'add'>('list');
    
    // Add Account Form State
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);

    const handleSwitch = async (userId: string) => {
        if (user?.id === userId) {
            onClose();
            return;
        }
        await switchAccount(userId);
        onClose();
    };

    const handleRemove = (userId: string, name: string) => {
        Alert.alert(
            'Remove Account',
            `Are you sure you want to remove ${name} from saved accounts on this device?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeAccount(userId);
                    }
                }
            ]
        );
    };

    const handleAddAccountSubmit = async () => {
        if (!loginId.trim() || !password.trim()) {
            Alert.alert('Required Fields', 'Please enter both Student ID and Password.');
            return;
        }

        setAuthenticating(true);
        try {
            const cleanId = loginId.trim();

            // Query Supabase for student record by login_id or registration_number
            const { data: student, error } = await supabase
                .from('students')
                .select('*')
                .or(`login_id.eq.${cleanId},registration_number.eq.${cleanId}`)
                .eq('password', password.trim())
                .maybeSingle();

            if (error || !student) {
                Alert.alert('Login Failed', 'Invalid Student ID or Password. Please try again.');
                return;
            }

            // Construct LoggedInUser object
            const newStudentUser = {
                id: student.id,
                full_name: student.full_name,
                role: 'student' as const,
                login_id: student.login_id || student.registration_number,
                registration_number: student.registration_number || student.login_id,
                class_id: student.class_id || undefined,
                parent_name: student.parent_name || undefined,
                parent_phone: student.parent_phone || undefined,
                parent_email: student.parent_email || undefined,
                photo_url: student.photo_url || undefined,
            };

            await addAccount(newStudentUser);
            
            // Reset form & close modal
            setLoginId('');
            setPassword('');
            setMode('list');
            onClose();

            Alert.alert('Success', `Logged in as ${student.full_name}!`);
        } catch (err: any) {
            console.error('Error adding account:', err);
            Alert.alert('Error', err.message || 'Failed to authenticate student account.');
        } finally {
            setAuthenticating(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.modalCardContainer}>
                    <LinearGradient
                        colors={['#150E28', '#090514']}
                        style={styles.modalGradient}
                    >
                        {/* Drag indicator bar */}
                        <View style={styles.dragBarContainer}>
                            <View style={styles.dragBar} />
                        </View>

                        {/* Modal Header */}
                        <View style={styles.headerRow}>
                            <Text style={styles.headerTitle}>
                                {mode === 'list' ? 'Switch Student Account' : 'Add Child Account'}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                            </TouchableOpacity>
                        </View>

                        {mode === 'list' ? (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                                <Text style={styles.sectionSubtitle}>
                                    Logged In Accounts ({accounts.length})
                                </Text>

                                {accounts.map((acc) => {
                                    const isActive = user?.id === acc.id;
                                    return (
                                        <TouchableOpacity
                                            key={acc.id}
                                            activeOpacity={0.8}
                                            style={[styles.accountCard, isActive && styles.activeAccountCard]}
                                            onPress={() => handleSwitch(acc.id)}
                                        >
                                            <View style={styles.avatarCircle}>
                                                {acc.photo_url ? (
                                                    <Image source={{ uri: acc.photo_url }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
                                                ) : (
                                                    <Text style={styles.avatarText}>
                                                        {acc.full_name?.charAt(0).toUpperCase() || 'S'}
                                                    </Text>
                                                )}
                                            </View>

                                            <View style={styles.accountInfo}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={styles.studentName} numberOfLines={1}>
                                                        {acc.full_name}
                                                    </Text>
                                                    {isActive && (
                                                        <View style={styles.activeTag}>
                                                            <Text style={styles.activeTagText}>ACTIVE</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.studentDetails}>
                                                    Reg: {acc.registration_number || 'N/A'}
                                                </Text>
                                            </View>

                                            {isActive ? (
                                                <View style={styles.checkmarkCircle}>
                                                    <Ionicons name="checkmark" size={18} color="#FFF" />
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => handleRemove(acc.id, acc.full_name)}
                                                    style={styles.removeBtn}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Add New Account Button */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.addAccountBtn}
                                    onPress={() => setMode('add')}
                                >
                                    <View style={styles.addIconCircle}>
                                        <Ionicons name="add" size={22} color="#A855F7" />
                                    </View>
                                    <Text style={styles.addAccountText}>Add Another Student Account</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            /* Add Account Form View */
                            <View style={styles.formContainer}>
                                <TouchableOpacity
                                    style={styles.backToListBtn}
                                    onPress={() => setMode('list')}
                                >
                                    <Ionicons name="arrow-back" size={18} color="#A855F7" />
                                    <Text style={styles.backToListText}>Back to Accounts List</Text>
                                </TouchableOpacity>

                                <Text style={styles.formInstructions}>
                                    Enter your second child's Student Registration ID & Password to link their profile.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Student ID / Registration No.</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" />
                                        <TextInput
                                            style={styles.textInput}
                                            value={loginId}
                                            onChangeText={setLoginId}
                                            placeholder="e.g. stu1042"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" />
                                        <TextInput
                                            style={styles.textInput}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Enter password"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={18}
                                                color="rgba(255,255,255,0.4)"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.submitAddBtn}
                                    onPress={handleAddAccountSubmit}
                                    disabled={authenticating}
                                >
                                    {authenticating ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.submitAddBtnText}>Link & Switch to Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalCardContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    modalGradient: {
        padding: 24,
        paddingTop: 12,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dragBarContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeBtn: {
        padding: 4,
    },
    scrollBody: {
        paddingBottom: 24,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 14,
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    activeAccountCard: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderColor: 'rgba(168, 85, 247, 0.4)',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#A855F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    accountInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    activeTag: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    studentDetails: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 2,
    },
    checkmarkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#A855F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeBtn: {
        padding: 8,
    },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 14,
        marginTop: 6,
    },
    addIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addAccountText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#C084FC',
    },

    // Form Styles
    formContainer: {
        paddingBottom: 24,
    },
    backToListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    backToListText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A855F7',
    },
    formInstructions: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        marginLeft: 10,
    },
    submitAddBtn: {
        backgroundColor: '#A855F7',
        borderRadius: 14,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    submitAddBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
