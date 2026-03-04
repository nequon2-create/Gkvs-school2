import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ParentTabNavigator from './ParentTabNavigator';
import TeacherTabNavigator from './TeacherTabNavigator';
import AddHomeworkScreen from '../screens/teacher/AddHomeworkScreen';
import TeacherClassListScreen from '../screens/teacher/TeacherClassListScreen';
import TeacherStudentListScreen from '../screens/teacher/TeacherStudentListScreen';
import StudentProfileScreen from '../screens/teacher/StudentProfileScreen';
import ReceiptsScreen from '../screens/parent/ReceiptsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { user, isLoading, loadUser } = useAuthStore();

    React.useEffect(() => {
        loadUser();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
                <ActivityIndicator size="large" color="#4F63AC" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                {!user ? (
                    <Stack.Group>
                        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                    </Stack.Group>
                ) : user.role === 'teacher' ? (
                    <Stack.Group>
                        <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
                        <Stack.Screen name="AddHomework" component={AddHomeworkScreen} />
                        <Stack.Screen name="TeacherClassList" component={TeacherClassListScreen} />
                        <Stack.Screen name="TeacherStudentList" component={TeacherStudentListScreen} />
                        <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
                    </Stack.Group>
                ) : (
                    <Stack.Group>
                        <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
                        <Stack.Screen name="Receipts" component={ReceiptsScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
