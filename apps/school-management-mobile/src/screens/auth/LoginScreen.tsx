import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ route, navigation }: Props) {
    // Role is passed from RoleSelectionScreen ('parent' or 'teacher')
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
            // Determine which table to query based on selected role
            const table = role === 'teacher' ? 'teachers' : 'students';

            // Query the database directly matching login_id and password
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('login_id', loginId.trim())
                .eq('password', password) // In a real app password should be hashed, but matching the web portal approach here
                .single();

            if (error || !data) {
                console.log('Login error:', error);
                Alert.alert('Login Failed', 'Invalid Login ID or Password. Please try again.');
                return;
            }

            // Authentication successful. Format user object for AuthStore
            const userObj = {
                id: data.id,
                role: role as UserRole,
                full_name: data.full_name,
                login_id: data.login_id,
                ...(role === 'teacher'
                    ? {
                        registration_number: data.registration_number,
                        subjects: data.subjects,
                        phone: data.phone,
                        email: data.email,
                        photo_url: data.photo_url
                    }
                    : {
                        registration_number: data.registration_number,
                        class_id: data.class_id,
                        section: data.section,
                        roll_number: data.roll_number
                    }
                )
            };

            await setUser(userObj);

            // Note: The AppNavigator will automatically switch to ParentTabs or TeacherTabs 
            // once useAuthStore's 'user' state is updated, so we don't need to manually navigate here.
        } catch (err) {
            console.error('Login exception:', err);
            Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const roleTitle = role === 'teacher' ? 'Teacher Portal' : 'Parent & Student Portal';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header Section */}
            <View style={styles.headerSection}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.logoWrapper}>
                    <Image
                        source={require('../../../assets/images/logo.jpeg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.schoolNameMain}>Grameen Krida Vasati Shale</Text>
                <Text style={styles.schoolNameSub}>Sharan Sirasagi</Text>
                <View style={styles.divider} />
                <Text style={styles.appLabel}>{roleTitle.toUpperCase()}</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Sign In</Text>
                <Text style={styles.cardSubtitle}>
                    Enter the Login ID and Password provided by the school admin.
                </Text>

                {/* Login ID Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Login ID</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={`Enter your ${role} login ID`}
                        placeholderTextColor="#aaa"
                        value={loginId}
                        onChangeText={setLoginId}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.loginBtnText}>Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>© 2025 Sharana Sirasigi School</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a3a5c',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        minHeight: '100%' as any,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 0,
        padding: 8,
        zIndex: 10,
    },
    backButtonText: {
        color: '#f5a623',
        fontSize: 16,
        fontWeight: '600',
    },
    logoWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        marginTop: 20,
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    schoolNameMain: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    schoolNameSub: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 0.3,
    },
    divider: {
        width: 50,
        height: 2,
        backgroundColor: '#f5a623',
        borderRadius: 2,
        marginVertical: 14,
    },
    appLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f5a623',
        letterSpacing: 2,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
        elevation: 12,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a3a5c',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 24,
        lineHeight: 18,
    },
    inputGroup: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#222',
        backgroundColor: '#fafafa',
    },
    loginBtn: {
        height: 52,
        backgroundColor: '#1a3a5c',
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    loginBtnDisabled: {
        backgroundColor: '#9bb5d2',
    },
    loginBtnText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
});
