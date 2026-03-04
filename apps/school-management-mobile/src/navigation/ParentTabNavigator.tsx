import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ParentTabParamList } from '../types';

import ParentHomeScreen from '../screens/parent/HomeScreen';
import ParentEventsScreen from '../screens/parent/EventsScreen';
import ParentExamsScreen from '../screens/parent/ExamsScreen';
import ParentProfileScreen from '../screens/parent/ProfileScreen';

const Tab = createBottomTabNavigator<ParentTabParamList>();

const ACTIVE_COLOR = '#4F63AC';
const INACTIVE_COLOR = '#A0AEC0';
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
                        Exams: ['document-text', 'document-text-outline'],
                        Profile: ['person', 'person-outline'],
                    };
                    const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
                    return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={ParentHomeScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Events" component={ParentEventsScreen} options={{ tabBarLabel: 'Events' }} />
            <Tab.Screen name="Exams" component={ParentExamsScreen} options={{ tabBarLabel: 'Exams' }} />
            <Tab.Screen name="Profile" component={ParentProfileScreen} options={{ tabBarLabel: 'Profile' }} />
        </Tab.Navigator>
    );
}
