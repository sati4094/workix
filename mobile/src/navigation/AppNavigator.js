import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import { useAuthStore } from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import WorkOrdersScreen from '../screens/workorder/WorkOrdersScreen';
import WorkOrderDetailScreen from '../screens/workorder/WorkOrderDetailScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import SitesScreen from '../screens/sites/SitesScreen';
import AssetsScreen from '../screens/assets/AssetsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  console.log('AppNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="WorkOrders" 
            component={WorkOrdersScreen}
            options={{
              headerShown: true,
              title: 'Work Orders',
            }}
          />
          <Stack.Screen 
            name="WorkOrderDetail" 
            component={WorkOrderDetailScreen}
            options={{
              headerShown: true,
              title: 'Work Order Details',
            }}
          />
          <Stack.Screen 
            name="Projects" 
            component={ProjectsScreen}
            options={{
              headerShown: true,
              title: 'Projects',
            }}
          />
          <Stack.Screen 
            name="Sites" 
            component={SitesScreen}
            options={{
              headerShown: true,
              title: 'Sites',
            }}
          />
          <Stack.Screen 
            name="Assets" 
            component={AssetsScreen}
            options={{
              headerShown: true,
              title: 'Assets',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

