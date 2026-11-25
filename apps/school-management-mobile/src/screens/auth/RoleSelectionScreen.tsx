import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';
import { AppleColors, AppleTypography, AppleShadows } from '../../config/theme';
import { AppleTouchable } from '../../components/AppleTouchable';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export default function RoleSelectionScreen({ navigation }: Props) {
    const handleRoleSelect = (role: UserRole) => {
        navigation.navigate('Login', { role });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={AppleColors.background} />
            <View style={styles.container}>
                {/* Header Branding */}
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Ionicons name="school" size={38} color={AppleColors.primary} />
                    </View>
                    <Text style={styles.schoolName}>GKVS School</Text>
                    <Text style={styles.schoolSubtitle}>School Management System</Text>
                </View>

                {/* Welcome & Prompt */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Welcome</Text>
                    <Text style={styles.description}>Select your portal to continue</Text>
                </View>

                {/* Apple Grouped Role Cards */}
                <View style={styles.cardsContainer}>
                    {/* Parent / Student Card */}
                    <AppleTouchable
                        style={styles.card}
                        onPress={() => handleRoleSelect('parent')}
                        hapticStyle="medium"
                    >
                        <View style={styles.cardContent}>
                            <View style={[styles.iconContainer, { backgroundColor: '#EBF5FF' }]}>
                                <Ionicons name="people" size={30} color={AppleColors.primary} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Parent / Student</Text>
                                <Text style={styles.cardSubtitle}>
                                    View attendance, exams, fees & school events
                                </Text>
                            </View>
                            <View style={styles.chevronContainer}>
                                <Ionicons name="chevron-forward" size={20} color={AppleColors.textTertiary} />
                            </View>
                        </View>
                    </AppleTouchable>

                    {/* Teacher Card */}
                    <AppleTouchable
                        style={styles.card}
                        onPress={() => handleRoleSelect('teacher')}
                        hapticStyle="medium"
                    >
                        <View style={styles.cardContent}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E8F9EE' }]}>
                                <Ionicons name="school-outline" size={30} color={AppleColors.success} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>Teacher</Text>
                                <Text style={styles.cardSubtitle}>
                                    Mark attendance, manage homework & class records
                                </Text>
                            </View>
                            <View style={styles.chevronContainer}>
                                <Ionicons name="chevron-forward" size={20} color={AppleColors.textTertiary} />
                            </View>
                        </View>
                    </AppleTouchable>
                </View>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Designed with Apple Human Interface Standards</Text>
                </View>
            </View>
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
        paddingHorizontal: 24,
        paddingTop: 24,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 16,
    },
    logoBadge: {
        width: 76,
        height: 76,
        borderRadius: 22,
        backgroundColor: AppleColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: AppleColors.borderLight,
        ...AppleShadows.card,
    },
    schoolName: {
        ...AppleTypography.title2,
        fontWeight: '700',
        color: AppleColors.textPrimary,
        letterSpacing: -0.3,
    },
    schoolSubtitle: {
        ...AppleTypography.footnote,
        color: AppleColors.textSecondary,
        marginTop: 4,
    },
    titleContainer: {
        alignItems: 'center',
        marginVertical: 18,
    },
    title: {
        ...AppleTypography.largeTitle,
        color: AppleColors.textPrimary,
        fontWeight: '800',
    },
    description: {
        ...AppleTypography.subhead,
        color: AppleColors.textSecondary,
        marginTop: 6,
    },
    cardsContainer: {
        width: '100%',
        gap: 16,
    },
    card: {
        backgroundColor: AppleColors.surface,
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: AppleColors.borderSubtle,
        ...AppleShadows.card,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        ...AppleTypography.headline,
        fontSize: 18,
        fontWeight: '700',
        color: AppleColors.textPrimary,
    },
    cardSubtitle: {
        ...AppleTypography.footnote,
        color: AppleColors.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    chevronContainer: {
        marginLeft: 8,
    },
    footerContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    footerText: {
        ...AppleTypography.caption,
        color: AppleColors.textTertiary,
    },
});
