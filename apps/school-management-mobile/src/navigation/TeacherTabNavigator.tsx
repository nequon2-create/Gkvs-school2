import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TeacherTabParamList } from '../types';

import TeacherHomeScreen from '../screens/teacher/HomeScreen';
import TeacherEventsScreen from '../screens/teacher/EventsScreen';
import TeacherLeaderboardScreen from '../screens/teacher/LeaderboardScreen';
import TeacherAttendanceScreen from '../screens/teacher/AttendanceScreen';
import TeacherProfileScreen from '../screens/teacher/ProfileScreen';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

const ACTIVE_COLOR = '#2D7D46';
const INACTIVE_COLOR = '#A0AEC0';
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
                    borderTopWidth: 0,
                    elevation: 8,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, [string, string]> = {
                        Home: ['home', 'home-outline'],
                        Events: ['calendar', 'calendar-outline'],
                        Leaderboard: ['trophy', 'trophy-outline'],
                        Attendance: ['checkmark-circle', 'checkmark-circle-outline'],
                        Profile: ['person', 'person-outline'],
                    };
                    const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={TeacherHomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Events" component={TeacherEventsScreen} options={{ tabBarLabel: 'Events' }} />
            <Tab.Screen name="Leaderboard" component={TeacherLeaderboardScreen} options={{ tabBarLabel: 'Arena' }} />
            <Tab.Screen name="Attendance" component={TeacherAttendanceScreen} options={{ tabBarLabel: 'Attendance' }} />
            <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}
