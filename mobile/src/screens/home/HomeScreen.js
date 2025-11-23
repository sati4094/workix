import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

function DashboardCard({ title, icon, gradient, count, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <LinearGradient
        colors={gradient}
        style={styles.gradientCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardIconContainer}>
          <MaterialCommunityIcons name={icon} size={40} color="#fff" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardCount}>{count}</Text>
        </View>
        <View style={styles.cardArrow}>
          <MaterialCommunityIcons name="chevron-right" size={28} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isLoading, error } = useWorkOrderStore();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState({
    myWorkOrders: 0,
    allWorkOrders: 0,
    projects: 0,
    sites: 0,
    assets: 0,
  });
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingError(null);
      await fetchWorkOrders();
      
      // Calculate stats
      const myWOs = workOrders.filter(wo => wo.assigned_to === user?.id).length;
      const allWOs = workOrders.length;
      
      setStats({
        myWorkOrders: myWOs,
        allWorkOrders: allWOs,
        projects: 0, // Will be fetched from API
        sites: 0,    // Will be fetched from API
        assets: 0,   // Will be fetched from API
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setLoadingError(err.message || 'Failed to load dashboard data');
    }
  };

  const navigateToWorkOrders = (filterType) => {
    navigation.navigate('WorkOrders', { filter: filterType });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if loading failed
  if (loadingError || error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={60} color={theme.colors.error} />
          <Text style={{ marginTop: 16, color: theme.colors.error, textAlign: 'center', paddingHorizontal: 20 }}>
            {loadingError || error || 'Failed to load dashboard'}
          </Text>
          <TouchableOpacity onPress={loadDashboardData} style={{ marginTop: 20 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f5f7fa' }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
            <MaterialCommunityIcons name="account-circle" size={40} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.cardsGrid}>
          {/* My Work Orders Card */}
          <DashboardCard
            title="My Work Orders"
            icon="clipboard-text"
            gradient={['#3b82f6', '#1d4ed8']}
            count={stats.myWorkOrders}
            onPress={() => navigateToWorkOrders('my')}
          />

          {/* All Work Orders Card */}
          <DashboardCard
            title="All Work Orders"
            icon="clipboard-list"
            gradient={['#8b5cf6', '#6d28d9']}
            count={stats.allWorkOrders}
            onPress={() => navigateToWorkOrders('all')}
          />

          {/* Projects Card */}
          <DashboardCard
            title="Projects"
            icon="briefcase"
            gradient={['#10b981', '#059669']}
            count={stats.projects}
            onPress={() => navigation.navigate('Projects')}
          />

          {/* Sites Card */}
          <DashboardCard
            title="Sites"
            icon="map-marker"
            gradient={['#f59e0b', '#d97706']}
            count={stats.sites}
            onPress={() => navigation.navigate('Sites')}
          />

          {/* Assets Card */}
          <DashboardCard
            title="Assets"
            icon="package-variant"
            gradient={['#ec4899', '#db2777']}
            count={stats.assets}
            onPress={() => navigation.navigate('Assets')}
          />
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="clock-alert" size={24} color="#f59e0b" />
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statValue}>
                    {workOrders.filter(wo => wo.status === 'pending').length}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="progress-clock" size={24} color="#3b82f6" />
                  <Text style={styles.statLabel}>In Progress</Text>
                  <Text style={styles.statValue}>
                    {workOrders.filter(wo => wo.status === 'in_progress').length}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                  <Text style={styles.statLabel}>Completed</Text>
                  <Text style={styles.statValue}>
                    {workOrders.filter(wo => wo.status === 'completed').length}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileButton: {
    padding: 4,
  },
  cardsGrid: {
    padding: 16,
    gap: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  gradientCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardArrow: {
    marginLeft: 8,
  },
  statsSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsCard: {
    borderRadius: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
});

