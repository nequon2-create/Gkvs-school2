import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../types';

import ParentHomeScreen from '../screens/parent/HomeScreen';
import ParentEventsScreen from '../screens/parent/EventsScreen';
import ParentLeaderboardScreen from '../screens/parent/LeaderboardScreen';
import ParentExamsScreen from '../screens/parent/ExamsScreen';
import ParentProfileScreen from '../screens/parent/ProfileScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

const ACTIVE_COLOR = '#A855F7'; // Sleek premium neon purple
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.4)';
const TAB_BG = 'rgba(15, 11, 28, 0.92)';

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
                    borderTopColor: 'rgba(255, 255, 255, 0.08)',
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 24 : 16,
                    left: 20,
                    right: 20,
                    borderRadius: 24,
                    height: 64,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                },
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4 },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, [string, string]> = {
                        Home: ['home', 'home-outline'],
                        Events: ['calendar', 'calendar-outline'],
                        Leaderboard: ['trophy', 'trophy-outline'],
                        Exams: ['document-text', 'document-text-outline'],
                        Profile: ['person', 'person-outline'],
                    };
                    const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={focused ? size + 2 : size} color={color} />;
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

