import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../types';
import { AppleColors, AppleShadows } from '../config/theme';

import ParentHomeScreen from '../screens/parent/HomeScreen';
import ParentEventsScreen from '../screens/parent/EventsScreen';
import ParentLeaderboardScreen from '../screens/parent/LeaderboardScreen';
import ParentExamsScreen from '../screens/parent/ExamsScreen';
import ParentProfileScreen from '../screens/parent/ProfileScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

const ACTIVE_COLOR = AppleColors.primary;
const INACTIVE_COLOR = AppleColors.textTertiary;
const TAB_BG = '#FFFFFF';

export default function ParentTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: ACTIVE_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
                tabBarStyle: {
                    backgroundColor: TAB_BG,
                    borderTopWidth: 1,
                    borderTopColor: AppleColors.borderLight,
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 24 : 16,
                    left: 18,
                    right: 18,
                    borderRadius: 22,
                    height: 64,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
                    ...AppleShadows.floating,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 3 },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, [string, string]> = {
                        Home: ['home', 'home-outline'],
                        Events: ['calendar', 'calendar-outline'],
                        Leaderboard: ['trophy', 'trophy-outline'],
                        Exams: ['document-text', 'document-text-outline'],
                        Profile: ['person', 'person-outline'],
                    };
                    const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={focused ? size + 1 : size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={ParentHomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Events" component={ParentEventsScreen} options={{ tabBarLabel: 'Events' }} />
            <Tab.Screen name="Leaderboard" component={ParentLeaderboardScreen} options={{ tabBarLabel: 'Arena' }} />
            <Tab.Screen name="Exams" component={ParentExamsScreen} options={{ tabBarLabel: 'Exams' }} />
            <Tab.Screen name="Profile" component={ParentProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}
