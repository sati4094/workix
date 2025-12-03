import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

import { useWorkOrderStore } from '../../store/workOrderStore';

const statusColors = {
  pending: '#94a3b8',
  acknowledged: '#3b82f6',
  in_progress: '#f59e0b',
  parts_pending: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#64748b',
};

function WorkOrderCard({ workOrder, onPress }) {
  const theme = useTheme();
  const statusColor = statusColors[workOrder.status];

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {workOrder.work_order_number}
            </Text>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {workOrder.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {(workOrder.enterprise_name || workOrder.client_name || '—')} • {workOrder.site_name}
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
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {workOrder.assets.map(a => a.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {format(new Date(workOrder.created_at), 'MMM dd, yyyy')}
            </Text>
          </View>
          {workOrder.activity_count > 0 && (
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="message" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                {workOrder.activity_count} activities
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function ActivityScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isRefreshing, filters, setFilters } = useWorkOrderStore();
  
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleRefresh = () => {
    fetchWorkOrders(true);
  };

  const handleWorkOrderPress = (workOrder) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
  };

  // Filter work orders based on status
  const getFilteredWorkOrders = () => {
    switch (statusFilter) {
      case 'active':
        return workOrders.filter(wo => 
          ['acknowledged', 'in_progress', 'parts_pending'].includes(wo.status)
        );
      case 'completed':
        return workOrders.filter(wo => wo.status === 'completed');
      case 'all':
      default:
        return workOrders.filter(wo => wo.status !== 'pending');
    }
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'all', label: 'All' },
          ]}
        />
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
            {statusFilter === 'active' 
              ? 'No active work orders. Check your inbox for new requests.'
              : 'No work orders found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkOrders}
          renderItem={({ item }) => (
            <WorkOrderCard workOrder={item} onPress={() => handleWorkOrderPress(item)} />
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
  filterContainer: {
    padding: 16,
    paddingBottom: 8,
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

