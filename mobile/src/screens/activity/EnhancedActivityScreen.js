import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, useTheme, FAB, Searchbar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format, formatDistanceToNow } from 'date-fns';

import { useWorkOrderStore } from '../../store/workOrderStore';

const statusColors = {
  pending: '#94a3b8',
  acknowledged: '#3b82f6',
  in_progress: '#f59e0b',
  parts_pending: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#64748b',
};

function WorkOrderCard({ workOrder, onPress, onQuickAction }) {
  const theme = useTheme();
  const statusColor = statusColors[workOrder.status];
  const daysOld = Math.floor((Date.now() - new Date(workOrder.created_at)) / (1000 * 60 * 60 * 24));

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {workOrder.work_order_number}
              </Text>
              {daysOld > 3 && (
                <Badge style={{ marginLeft: 8, backgroundColor: '#dc2626' }}>
                  {daysOld}d old
                </Badge>
              )}
            </View>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {workOrder.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {workOrder.site_name} • {workOrder.client_name}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: statusColor }]}
            textStyle={{ color: 'white', fontSize: 11 }}
          >
            {workOrder.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        {workOrder.assets && workOrder.assets.length > 0 && (
          <View style={styles.assetsContainer}>
            <MaterialCommunityIcons name="package-variant" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant, flex: 1 }} numberOfLines={1}>
              {workOrder.assets.map(a => a.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {formatDistanceToNow(new Date(workOrder.created_at), { addSuffix: true })}
            </Text>
          </View>
          {workOrder.activity_count > 0 && (
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="message" size={16} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.primary }}>
                {workOrder.activity_count} updates
              </Text>
            </View>
          )}
        </View>

        {/* Quick Action Button */}
        {workOrder.status === 'acknowledged' && (
          <Button
            mode="contained"
            icon="play"
            onPress={() => onQuickAction(workOrder.id, 'in_progress', 'Start Work')}
            style={{ marginTop: 12 }}
          >
            Start Work
          </Button>
        )}
        {workOrder.status === 'in_progress' && (
          <Button
            mode="contained"
            icon="check-circle"
            onPress={() => onQuickAction(workOrder.id, 'completed', 'Complete')}
            style={{ marginTop: 12 }}
            buttonColor={theme.colors.success || '#22c55e'}
          >
            Mark Complete
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

export default function EnhancedActivityScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isRefreshing, updateWorkOrderStatus } = useWorkOrderStore();
  
  const [statusFilter, setStatusFilter] = useState('active');
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

  const handleQuickAction = async (workOrderId, newStatus, actionName) => {
    Alert.alert(
      actionName,
      `${actionName} this work order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionName,
          onPress: async () => {
            const result = await updateWorkOrderStatus(workOrderId, newStatus);
            if (result.success) {
              Alert.alert('Success', `Work order ${actionName.toLowerCase()} successfully`);
              fetchWorkOrders(true);
            } else {
              Alert.alert('Error', result.error || 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  // Filter work orders
  const getFilteredWorkOrders = () => {
    let filtered = [];
    
    switch (statusFilter) {
      case 'active':
        filtered = workOrders.filter(wo => 
          ['acknowledged', 'in_progress', 'parts_pending'].includes(wo.status)
        );
        break;
      case 'completed':
        filtered = workOrders.filter(wo => wo.status === 'completed');
        break;
      case 'all':
      default:
        filtered = workOrders.filter(wo => wo.status !== 'pending');
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(query) ||
        wo.work_order_number.toLowerCase().includes(query) ||
        wo.site_name.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(wo => wo.priority === priorityFilter);
    }

    return filtered;
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  // Count statistics
  const stats = {
    active: workOrders.filter(wo => ['acknowledged', 'in_progress', 'parts_pending'].includes(wo.status)).length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    total: workOrders.filter(wo => wo.status !== 'pending').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text variant="titleLarge" style={{ color: theme.colors.primary }}>{stats.active}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text variant="titleLarge" style={{ color: '#22c55e' }}>{stats.completed}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text variant="titleLarge">{stats.total}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search my work orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { 
              value: 'active', 
              label: `Active (${stats.active})`,
              icon: 'progress-clock'
            },
            { 
              value: 'completed', 
              label: `Done (${stats.completed})`,
              icon: 'check-circle'
            },
            { 
              value: 'all', 
              label: 'All',
              icon: 'format-list-bulleted'
            },
          ]}
        />
      </View>

      {/* Priority Filter */}
      <View style={styles.priorityFilterContainer}>
        <Chip
          selected={priorityFilter === 'all'}
          onPress={() => setPriorityFilter('all')}
          style={styles.priorityChip}
        >
          All
        </Chip>
        <Chip
          selected={priorityFilter === 'critical'}
          onPress={() => setPriorityFilter('critical')}
          style={styles.priorityChip}
          selectedColor="#dc2626"
        >
          🔥 Critical
        </Chip>
        <Chip
          selected={priorityFilter === 'high'}
          onPress={() => setPriorityFilter('high')}
          style={styles.priorityChip}
          selectedColor="#f97316"
        >
          High
        </Chip>
      </View>

      {filteredWorkOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleLarge" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
            No Work Orders
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {searchQuery || priorityFilter !== 'all'
              ? 'No work orders match your filters'
              : statusFilter === 'active' 
                ? 'No active work orders. Check your inbox for new requests.'
                : 'No work orders found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkOrders}
          renderItem={({ item }) => (
            <WorkOrderCard 
              workOrder={item} 
              onPress={() => handleWorkOrderPress(item)}
              onQuickAction={handleQuickAction}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statBox: {
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  priorityFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  priorityChip: {
    marginRight: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
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
  statusChip: {
    height: 24,
    marginLeft: 8,
  },
  assetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 8,
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

