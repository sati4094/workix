import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, FAB, Portal, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import { useBiometricGate } from '../hooks/useBiometricGate';
import { QuickActionsSheet } from '../components/QuickActionsSheet';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Main Screens
import TechnicianHomeScreen from '../screens/home/TechnicianHomeScreen';
import MyQueueScreen from '../screens/queue/MyQueueScreen';
import ActivityScreen from '../screens/activity/ActivityScreen';
import ScanAndLookupScreen from '../screens/tools/ScanAndLookupScreen';
import WorkOrdersScreen from '../screens/workorder/WorkOrdersScreen';
import WorkOrderDetailScreen from '../screens/workorder/WorkOrderDetailScreen';
import ProjectsScreen from '../screens/projects/ProjectsScreen';
import SitesScreen from '../screens/sites/SitesScreen';
import AssetsScreen from '../screens/assets/AssetsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BiometricLockScreen({ isChecking, error, onRetry, onLogout }) {
  const theme = useTheme();
  return (
    <View style={[styles.lockContainer, { backgroundColor: theme.colors.background }] }>
      <MaterialCommunityIcons name="fingerprint" size={80} color="#2563eb" />
      <Text style={styles.lockTitle}>Unlock Workix</Text>
      <Text style={[styles.lockSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Authenticate to continue. This keeps technician data protected on shared devices.
      </Text>
      {error ? <Text style={[styles.lockError, { color: theme.colors.error }]}>{error}</Text> : null}
      <View style={styles.lockActions}>
        <Button
          mode="contained"
          icon={isChecking ? 'progress-clock' : 'refresh'}
          onPress={onRetry}
          disabled={isChecking}
          style={styles.lockButton}
        >
          Retry
        </Button>
        <Button mode="outlined" icon="logout" onPress={onLogout} style={styles.lockButton}>
          Logout
        </Button>
      </View>
    </View>
  );
}

// Main Tab Navigator
function TechnicianTabs() {
  const theme = useTheme();
  const [isSheetVisible, setSheetVisible] = useState(false);
  const navigation = useNavigation();
  const tabRef = useRef(null);
  
  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'scan-asset':
        navigation.navigate('MainTabs', { screen: 'Scan' });
        break;
      case 'voice-note':
        Alert.alert('Voice notes coming soon', 'Background voice dictation will arrive in Sprint 2.');
        break;
      case 'quick-complete':
        navigation.navigate('MainTabs', { screen: 'Queue' });
        break;
      case 'photo-capture':
        Alert.alert('Photo queue coming soon', 'Background uploads are being built in the next milestone.');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Tab.Navigator
        ref={tabRef}
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
          },
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const iconMap = {
              Home: 'view-dashboard',
              Queue: 'clipboard-text-clock',
              Activity: 'history',
              Scan: 'qrcode-scan',
              Profile: 'account',
            };
            const iconName = iconMap[route.name] ?? 'circle-outline';
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={TechnicianHomeScreen} options={{ tabBarLabel: 'Dashboard' }} />
        <Tab.Screen name="Queue" component={MyQueueScreen} options={{ tabBarLabel: 'My Queue' }} />
        <Tab.Screen name="Activity" component={ActivityScreen} />
        <Tab.Screen name="Scan" component={ScanAndLookupScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      <Portal>
        <FAB
          icon="flash"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setSheetVisible(true)}
          label="Quick"
        />
      </Portal>

      <QuickActionsSheet
        isVisible={isSheetVisible}
        onClose={() => setSheetVisible(false)}
        onActionPress={(actionKey) => {
          setSheetVisible(false);
          if (!tabRef.current) {
            handleQuickAction(actionKey);
            return;
          }

          switch (actionKey) {
            case 'scan-asset':
              tabRef.current.navigate('Scan');
              break;
            case 'quick-complete':
              tabRef.current.navigate('Queue');
              break;
            default:
              handleQuickAction(actionKey);
              break;
          }
        }}
      />
    </>
  );
}

// Root Navigator
export default function AppNavigator() {
  const theme = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuthStore();
  const { isUnlocked, isChecking, error, retry } = useBiometricGate(isAuthenticated);

  // Show loading screen while checking auth status
  if (isLoading || isChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated && !isUnlocked) {
    return (
      <BiometricLockScreen
        isChecking={isChecking}
        error={error}
        onRetry={retry}
        onLogout={logout}
      />
    );
  }

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
          <Stack.Screen name="MainTabs" component={TechnicianTabs} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 34,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  lockSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#475569',
  },
  lockError: {
    marginTop: 12,
    textAlign: 'center',
  },
  lockActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  lockButton: {
    minWidth: 120,
  },
});

