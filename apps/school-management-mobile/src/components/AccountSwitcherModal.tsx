import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, Image,
    TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { AppleColors, AppleTypography, AppleShadows } from '../config/theme';
import { AppleTouchable } from './AppleTouchable';

interface AccountSwitcherModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function AccountSwitcherModal({ visible, onClose }: AccountSwitcherModalProps) {
    const { user, accounts, switchAccount, addAccount, removeAccount, updateAccountPhoto } = useAuthStore();
    
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

    const [mode, setMode] = useState<'list' | 'add'>('list');
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
                <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
                    {/* iOS Grabber */}
                    <View style={styles.dragBarContainer}>
                        <View style={styles.dragBar} />
                    </View>

                    {/* Sheet Header */}
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>
                            {mode === 'list' ? 'Switch Student Account' : 'Add Child Account'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={26} color={AppleColors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    {mode === 'list' ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                            <Text style={styles.sectionSubtitle}>
                                Connected Accounts ({accounts.length})
                            </Text>

                            {accounts.map((acc) => {
                                const isActive = user?.id === acc.id;
                                return (
                                    <AppleTouchable
                                        key={acc.id}
                                        style={[styles.accountCard, isActive && styles.activeAccountCard]}
                                        onPress={() => handleSwitch(acc.id)}
                                        hapticStyle="selection"
                                    >
                                        <View style={styles.avatarCircle}>
                                            {acc.photo_url ? (
                                                <Image source={{ uri: acc.photo_url }} style={styles.avatarImg} />
                                            ) : (
                                                <Text style={styles.avatarText}>
                                                    {acc.full_name?.charAt(0).toUpperCase() || 'S'}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.accountInfo}>
                                            <View style={styles.nameRow}>
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
                                                ID: {acc.login_id || acc.registration_number || 'N/A'}
                                            </Text>
                                        </View>

                                        {isActive ? (
                                            <View style={styles.checkmarkCircle}>
                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handleRemove(acc.id, acc.full_name)}
                                                style={styles.removeBtn}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name="trash-outline" size={18} color={AppleColors.textTertiary} />
                                            </TouchableOpacity>
                                        )}
                                    </AppleTouchable>
                                );
                            })}

                            {/* Add Account Button */}
                            <AppleTouchable
                                style={styles.addAccountBtn}
                                onPress={() => setMode('add')}
                                hapticStyle="light"
                            >
                                <View style={styles.addIconCircle}>
                                    <Ionicons name="add" size={22} color={AppleColors.primary} />
                                </View>
                                <Text style={styles.addAccountText}>Add Another Child's Account</Text>
                            </AppleTouchable>
                        </ScrollView>
                    ) : (
                        <View style={styles.formContainer}>
                            <TouchableOpacity
                                style={styles.backToListBtn}
                                onPress={() => setMode('list')}
                            >
                                <Ionicons name="chevron-back" size={18} color={AppleColors.primary} />
                                <Text style={styles.backToListText}>Back to Accounts</Text>
                            </TouchableOpacity>

                            <Text style={styles.formInstructions}>
                                Enter the Student ID and Password provided by the school to link another account.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Student Login ID</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={18} color={AppleColors.textTertiary} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="e.g. STU102 or Reg Number"
                                        placeholderTextColor={AppleColors.textTertiary}
                                        value={loginId}
                                        onChangeText={setLoginId}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={18} color={AppleColors.textTertiary} />
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter password"
                                        placeholderTextColor={AppleColors.textTertiary}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color={AppleColors.textTertiary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <AppleTouchable
                                style={styles.submitAddBtn}
                                onPress={handleAddAccountSubmit}
                                disabled={authenticating}
                                hapticStyle="medium"
                            >
                                {authenticating ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitAddBtnText}>Verify & Link Account</Text>
                                )}
                            </AppleTouchable>
                        </View>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: AppleColors.surface,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 22,
        paddingBottom: 32,
        maxHeight: '82%',
        ...AppleShadows.floating,
    },
    dragBarContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    dragBar: {
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: AppleColors.borderLight,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        ...AppleTypography.title3,
        fontWeight: '700',
        color: AppleColors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    scrollBody: {
        paddingBottom: 20,
    },
    sectionSubtitle: {
        ...AppleTypography.caption,
        color: AppleColors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
        fontWeight: '600',
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppleColors.surfaceSecondary,
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: AppleColors.borderLight,
    },
    activeAccountCard: {
        backgroundColor: AppleColors.primaryLight,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AppleColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    accountInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    studentName: {
        ...AppleTypography.headline,
        color: AppleColors.textPrimary,
    },
    activeTag: {
        backgroundColor: AppleColors.primary,
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
        ...AppleTypography.footnote,
        color: AppleColors.textSecondary,
        marginTop: 2,
    },
    checkmarkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: AppleColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeBtn: {
        padding: 8,
    },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppleColors.surface,
        borderWidth: 1.5,
        borderColor: AppleColors.borderLight,
        borderStyle: 'dashed',
        borderRadius: 18,
        padding: 14,
        marginTop: 8,
    },
    addIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AppleColors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addAccountText: {
        ...AppleTypography.callout,
        fontWeight: '600',
        color: AppleColors.primary,
    },
    formContainer: {
        paddingBottom: 24,
    },
    backToListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 14,
    },
    backToListText: {
        ...AppleTypography.subhead,
        fontWeight: '600',
        color: AppleColors.primary,
    },
    formInstructions: {
        ...AppleTypography.footnote,
        color: AppleColors.textSecondary,
        lineHeight: 18,
        marginBottom: 18,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        ...AppleTypography.subhead,
        fontWeight: '600',
        color: AppleColors.textPrimary,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppleColors.surfaceSecondary,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: AppleColors.borderLight,
    },
    textInput: {
        flex: 1,
        ...AppleTypography.body,
        color: AppleColors.textPrimary,
        marginLeft: 10,
    },
    submitAddBtn: {
        backgroundColor: AppleColors.primary,
        borderRadius: 16,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        ...AppleShadows.subtle,
    },
    submitAddBtnText: {
        ...AppleTypography.headline,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
