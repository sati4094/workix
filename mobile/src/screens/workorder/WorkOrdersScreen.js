import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, useTheme, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { useAuthStore } from '../../store/authStore';

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#dc2626',
};

function WorkOrderCard({ workOrder, onPress }) {
  const theme = useTheme();
  const priorityColor = priorityColors[workOrder.priority];

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
          </View>
          <Chip
            style={[styles.priorityChip, { backgroundColor: priorityColor + '20' }]}
            textStyle={{ color: priorityColor, fontSize: 11, fontWeight: 'bold' }}
          >
            {workOrder.priority.toUpperCase()}
          </Chip>
        </View>

        {workOrder.description && (
          <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
            {workOrder.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {format(new Date(workOrder.created_at), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="tag" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {workOrder.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function WorkOrdersScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { workOrders, fetchWorkOrders, isLoading, isRefreshing } = useWorkOrderStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState(route.params?.filter || 'my');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleRefresh = () => {
    fetchWorkOrders(true);
  };

  const handleWorkOrderPress = (workOrder) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
  };

  // Filter work orders based on selection
  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = searchQuery === '' || 
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || wo.assigned_to === user?.id;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={[
            {
              value: 'my',
              label: 'My Work Orders',
              icon: 'account',
            },
            {
              value: 'all',
              label: 'All Work Orders',
              icon: 'format-list-bulleted',
            },
          ]}
        />
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search work orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {filteredWorkOrders.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="clipboard-text-off-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleLarge" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
            No Work Orders Found
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {filterType === 'my' ? 'No work orders assigned to you yet.' : 'No work orders available.'}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
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
    marginBottom: 8,
  },
  cardTitle: {
    marginTop: 4,
  },
  priorityChip: {
    height: 24,
  },
  description: {
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
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
