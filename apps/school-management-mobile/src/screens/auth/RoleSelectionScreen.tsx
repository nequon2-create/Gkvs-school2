import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export default function RoleSelectionScreen({ navigation }: Props) {
    const handleRoleSelect = (role: UserRole) => {
        navigation.navigate('Login', { role });
    };

    return (
        <LinearGradient colors={['#1A1A2E', '#16213E', '#0F3460']} style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoCircle}>
                    <Ionicons name="school" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.schoolName}>GKVS School</Text>
                <Text style={styles.subtitle}>School Management System</Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.description}>Please select your role to continue</Text>
            </View>

            {/* Role Cards */}
            <View style={styles.cardsContainer}>
                {/* Parent Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('parent')}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#4F63AC', '#6B7FD7']}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.cardIconCircle}>
                            <Ionicons name="people" size={36} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardTitle}>Parent / Student</Text>
                        <Text style={styles.cardDesc}>View attendance, exams, fees & events</Text>
                        <View style={styles.cardArrow}>
                            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Teacher Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('teacher')}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#2D7D46', '#3DA05A']}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.cardIconCircle}>
                            <Ionicons name="person-circle" size={36} color="#FFFFFF" />
                        </View>
                        <Text style={styles.cardTitle}>Teacher</Text>
                        <Text style={styles.cardDesc}>Mark attendance, manage homework & classes</Text>
                        <View style={styles.cardArrow}>
                            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>Powered by GKVS Management System</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    schoolName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    description: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.65)',
        marginTop: 6,
    },
    cardsContainer: {
        width: '100%',
        gap: 16,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
    },
    cardGradient: {
        padding: 24,
        position: 'relative',
    },
    cardIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 18,
        maxWidth: '80%',
    },
    cardArrow: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: 8,
    },
    footer: {
        marginTop: 40,
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
    },
});
