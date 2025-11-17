import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Animated } from 'react-native';
import { Text, Card, Chip, Searchbar, useTheme, FAB, Button, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

import { useWorkOrderStore } from '../../store/workOrderStore';

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#dc2626',
};

const priorityIcons = {
  low: 'alert-circle-outline',
  medium: 'alert',
  high: 'alert-octagon',
  critical: 'fire',
};

function WorkOrderCard({ workOrder, onPress, onAcknowledge }) {
  const theme = useTheme();
  const priorityColor = priorityColors[workOrder.priority];
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Card 
        style={styles.card} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {workOrder.work_order_number}
                </Text>
                <Badge style={{ marginLeft: 8, backgroundColor: priorityColor }}>
                  {workOrder.priority.toUpperCase()}
                </Badge>
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {workOrder.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                📍 {workOrder.site_name}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={priorityIcons[workOrder.priority]}
              size={36}
              color={priorityColor}
            />
          </View>

          <View style={styles.cardDetails}>
            <Chip
              icon="tag"
              style={[styles.chip, { backgroundColor: priorityColor + '20' }]}
              textStyle={{ color: priorityColor, fontSize: 12 }}
            >
              {workOrder.priority.toUpperCase()}
            </Chip>
            
            <Chip
              icon="information"
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            >
              {workOrder.source.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          {workOrder.description && (
            <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
              {workOrder.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                {format(new Date(workOrder.created_at), 'MMM dd, yyyy')}
              </Text>
            </View>
            {workOrder.asset_count > 0 && (
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="package-variant" size={16} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                  {workOrder.asset_count} asset(s)
                </Text>
              </View>
            )}
          </View>

          {/* Quick Action Button */}
          <Button
            mode="contained"
            onPress={() => onAcknowledge(workOrder.id, workOrder.title)}
            style={{ marginTop: 12 }}
            icon="check"
          >
            Acknowledge & Start
          </Button>
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isRefreshing, updateWorkOrderStatus } = useWorkOrderStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleRefresh = () => {
    fetchWorkOrders(true);
  };

  const handleWorkOrderPress = (workOrder) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
  };

  const handleAcknowledge = async (workOrderId, title) => {
    Alert.alert(
      'Acknowledge Work Order',
      `Start working on "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async () => {
            const result = await updateWorkOrderStatus(workOrderId, 'acknowledged');
            if (result.success) {
              Alert.alert('Success', 'Work order acknowledged! Now visible in Activity tab.');
              fetchWorkOrders(true);
            } else {
              Alert.alert('Error', result.error || 'Failed to acknowledge');
            }
          }
        }
      ]
    );
  };

  // Filter pending work orders
  const pendingWorkOrders = workOrders.filter(wo => {
    if (wo.status !== 'pending') return false;
    if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
    if (searchQuery && 
        !wo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Count by priority
  const criticalCount = pendingWorkOrders.filter(wo => wo.priority === 'critical').length;
  const highCount = pendingWorkOrders.filter(wo => wo.priority === 'high').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Stats Bar */}
      {pendingWorkOrders.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Total Pending
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {pendingWorkOrders.length}
            </Text>
          </View>
          {criticalCount > 0 && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={{ color: '#dc2626' }}>
                Critical
              </Text>
              <Text variant="titleLarge" style={{ color: '#dc2626' }}>
                {criticalCount}
              </Text>
            </View>
          )}
          {highCount > 0 && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={{ color: '#f97316' }}>
                High Priority
              </Text>
              <Text variant="titleLarge" style={{ color: '#f97316' }}>
                {highCount}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search work orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
        />
      </View>

      {/* Priority Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={priorityFilter === 'all'}
          onPress={() => setPriorityFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={priorityFilter === 'critical'}
          onPress={() => setPriorityFilter('critical')}
          style={styles.filterChip}
          selectedColor="#dc2626"
        >
          Critical
        </Chip>
        <Chip
          selected={priorityFilter === 'high'}
          onPress={() => setPriorityFilter('high')}
          style={styles.filterChip}
          selectedColor="#f97316"
        >
          High
        </Chip>
        <Chip
          selected={priorityFilter === 'medium'}
          onPress={() => setPriorityFilter('medium')}
          style={styles.filterChip}
          selectedColor="#f59e0b"
        >
          Medium
        </Chip>
      </View>

      {pendingWorkOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="inbox-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleLarge" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
            No Pending Requests
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {searchQuery || priorityFilter !== 'all' 
              ? 'No work orders match your filters' 
              : 'All caught up! New service requests will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingWorkOrders}
          renderItem={({ item }) => (
            <WorkOrderCard 
              workOrder={item} 
              onPress={() => handleWorkOrderPress(item)}
              onAcknowledge={handleAcknowledge}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    marginTop: 4,
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    height: 28,
  },
  description: {
    marginTop: 8,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

