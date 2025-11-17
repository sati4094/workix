import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Avatar, Text, useTheme, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { getSyncStatus, processOfflineQueue } from '../../services/offlineService';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const [syncStatus, setSyncStatus] = React.useState(null);

  React.useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const status = await getSyncStatus();
    setSyncStatus(status);
  };

  const handleSyncNow = async () => {
    try {
      await processOfflineQueue();
      await loadSyncStatus();
      Alert.alert('Success', 'Sync completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView>
        {/* User Header */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={getInitials(user?.name || 'U')}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {user?.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
          <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
            {user?.role?.toUpperCase()} {user?.team ? `• ${user.team}` : ''}
          </Text>
        </View>

        <Divider />

        {/* Account Section */}
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
          />
          
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon')}
          />
          
          {user?.phone && (
            <List.Item
              title="Phone Number"
              description={user.phone}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />
          )}
        </List.Section>

        <Divider />

        {/* Sync Section */}
        <List.Section>
          <List.Subheader>Data Sync</List.Subheader>
          
          {syncStatus && (
            <View style={styles.syncInfo}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Last Sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Synced: {syncStatus.synced || 0} • Failed: {syncStatus.failed || 0} • Pending: {syncStatus.remaining || 0}
              </Text>
            </View>
          )}
          
          <List.Item
            title="Sync Now"
            description="Sync pending data with server"
            left={(props) => <List.Icon {...props} icon="sync" />}
            onPress={handleSyncNow}
          />
          
          <List.Item
            title="Offline Mode"
            description="View and edit data offline"
            left={(props) => <List.Icon {...props} icon="cloud-off-outline" />}
            right={(props) => <List.Icon {...props} icon="check" color={theme.colors.primary} />}
          />
        </List.Section>

        <Divider />

        {/* App Section */}
        <List.Section>
          <List.Subheader>App</List.Subheader>
          
          <List.Item
            title="App Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <List.Item
            title="About Workix"
            description="EPC Service Management Platform"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
            onPress={() => Alert.alert('Workix', 'Version 1.0.0\n\nField Service Management for Energy Performance Contracting')}
          />
        </List.Section>

        <Divider />

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            buttonColor={theme.colors.error}
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Workix Mobile v1.0.0
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            © 2024 All rights reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  name: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  syncInfo: {
    padding: 16,
    paddingTop: 8,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
  },
  logoutButton: {
    paddingVertical: 4,
  },
  footer: {
    padding: 24,
    marginTop: 16,
  },
});

