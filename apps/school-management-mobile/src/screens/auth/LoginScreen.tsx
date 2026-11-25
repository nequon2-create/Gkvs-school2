import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
    Linking,
    StatusBar,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';
import { AppleColors, AppleTypography, AppleShadows } from '../../config/theme';
import { AppleTouchable } from '../../components/AppleTouchable';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ route, navigation }: Props) {
    const { role } = route.params || { role: 'parent' };

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setUser } = useAuthStore();

    const handleLogin = async () => {
        if (!loginId.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your Login ID and Password.');
            return;
        }

        setLoading(true);
        try {
            const table = role === 'teacher' ? 'teachers' : 'students';

            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('login_id', loginId.trim())
                .eq('password', password)
                .single();

            if (error || !data) {
                console.log('Login error:', error);
                Alert.alert('Login Failed', 'Invalid Login ID or Password. Please check your credentials and try again.');
                return;
            }

            const userObj = {
                id: data.id,
                role: role as UserRole,
                full_name: data.full_name,
                login_id: data.login_id,
            };

            setUser(userObj);
        } catch (err) {
            console.error('Login exception:', err);
            Alert.alert('Connection Error', 'Unable to reach the school database. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const roleTitle = role === 'teacher' ? 'Teacher Portal' : 'Parent & Student Portal';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={AppleColors.background} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <View style={styles.navBar}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={AppleColors.primary} />
                        <Text style={styles.backButtonText}>Roles</Text>
                    </TouchableOpacity>
                </View>

                {/* Header Branding */}
                <View style={styles.headerSection}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../../../assets/images/logo.jpeg')}
                            style={styles.logo}
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={styles.schoolNameMain}>Grameen Krida Vasati Shale</Text>
                    <Text style={styles.schoolNameSub}>Sharan Sirasagi</Text>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.appLabel}>{roleTitle}</Text>
                    </View>
                </View>

                {/* Apple Grouped Sign-In Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sign In</Text>
                    <Text style={styles.cardSubtitle}>
                        Enter the credentials provided by the school administrator.
                    </Text>

                    {/* Login ID Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Login ID</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={18} color={AppleColors.textTertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={`Enter ${role} ID (e.g. ${role === 'teacher' ? 'TCH101' : 'STU101'})`}
                                placeholderTextColor={AppleColors.textTertiary}
                                value={loginId}
                                onChangeText={setLoginId}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={18} color={AppleColors.textTertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={AppleColors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Tactile Apple Sign-In Button */}
                    <AppleTouchable
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        hapticStyle="medium"
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.loginBtnText}>Sign In</Text>
                        )}
                    </AppleTouchable>
                </View>

                {/* Footer Section */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footer}>© 2025 Sharana Sirasigi School</Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('https://nequon.com')}
                        activeOpacity={0.7}
                        style={styles.nequonFooterLink}
                    >
                        <Text style={styles.nequonFooterText}>Powered by Nequon</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppleColors.background,
    },
    container: {
        flex: 1,
        backgroundColor: AppleColors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    navBar: {
        flexDirection: 'row',
        paddingVertical: 12,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    backButtonText: {
        ...AppleTypography.body,
        color: AppleColors.primary,
        marginLeft: 2,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoWrapper: {
        width: 84,
        height: 84,
        borderRadius: 22,
        backgroundColor: AppleColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: AppleColors.borderLight,
        ...AppleShadows.card,
        overflow: 'hidden',
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    schoolNameMain: {
        ...AppleTypography.title3,
        fontWeight: '700',
        color: AppleColors.textPrimary,
        textAlign: 'center',
    },
    schoolNameSub: {
        ...AppleTypography.subhead,
        color: AppleColors.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },
    badgeContainer: {
        marginTop: 10,
        backgroundColor: AppleColors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    appLabel: {
        ...AppleTypography.caption,
        color: AppleColors.primaryDark,
        fontWeight: '700',
    },
    card: {
        backgroundColor: AppleColors.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: AppleColors.borderSubtle,
        ...AppleShadows.card,
    },
    cardTitle: {
        ...AppleTypography.title2,
        color: AppleColors.textPrimary,
        fontWeight: '700',
    },
    cardSubtitle: {
        ...AppleTypography.footnote,
        color: AppleColors.textSecondary,
        marginTop: 6,
        marginBottom: 20,
        lineHeight: 18,
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        ...AppleTypography.subhead,
        fontWeight: '600',
        color: AppleColors.textPrimary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppleColors.surfaceSecondary,
        borderWidth: 1,
        borderColor: AppleColors.borderLight,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        ...AppleTypography.body,
        color: AppleColors.textPrimary,
    },
    loginBtn: {
        height: 52,
        backgroundColor: AppleColors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        ...AppleShadows.subtle,
    },
    loginBtnDisabled: {
        opacity: 0.6,
    },
    loginBtnText: {
        ...AppleTypography.headline,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    footerContainer: {
        marginTop: 28,
        alignItems: 'center',
        gap: 6,
    },
    footer: {
        ...AppleTypography.caption,
        color: AppleColors.textTertiary,
    },
    nequonFooterLink: {
        paddingVertical: 4,
    },
    nequonFooterText: {
        ...AppleTypography.caption,
        color: AppleColors.primary,
        fontWeight: '600',
    },
});
