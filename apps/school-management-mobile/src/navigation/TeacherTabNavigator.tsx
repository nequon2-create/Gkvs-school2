import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TeacherTabParamList } from '../types';
import { AppleColors, AppleShadows } from '../config/theme';

import TeacherHomeScreen from '../screens/teacher/HomeScreen';
import TeacherMarksScreen from '../screens/teacher/MarksScreen';
import TeacherEventsScreen from '../screens/teacher/EventsScreen';
import TeacherLeaderboardScreen from '../screens/teacher/LeaderboardScreen';
import TeacherAttendanceScreen from '../screens/teacher/AttendanceScreen';
import TeacherProfileScreen from '../screens/teacher/ProfileScreen';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

const ACTIVE_COLOR = AppleColors.primary;
const INACTIVE_COLOR = AppleColors.textTertiary;
const TAB_BG = '#FFFFFF';

export default function TeacherTabNavigator() {
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
                        Marks: ['create', 'create-outline'],
                        Attendance: ['checkmark-circle', 'checkmark-circle-outline'],
                        Leaderboard: ['trophy', 'trophy-outline'],
                        Events: ['calendar', 'calendar-outline'],
                        Profile: ['person', 'person-outline'],
                    };
                    const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={focused ? size + 1 : size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={TeacherHomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Marks" component={TeacherMarksScreen} options={{ tabBarLabel: 'Marks' }} />
            <Tab.Screen name="Attendance" component={TeacherAttendanceScreen} options={{ tabBarLabel: 'Attendance' }} />
            <Tab.Screen name="Leaderboard" component={TeacherLeaderboardScreen} options={{ tabBarLabel: 'Arena' }} />
            <Tab.Screen name="Events" component={TeacherEventsScreen} options={{ tabBarLabel: 'Events' }} />
            <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}
