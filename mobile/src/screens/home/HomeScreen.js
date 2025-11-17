import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, IconButton, Searchbar, useTheme, FAB } from 'react-native-paper';
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
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {workOrder.site_name}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={priorityIcons[workOrder.priority]}
            size={32}
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
      </Card.Content>
    </Card>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isLoading, isRefreshing, filters, setFilters } = useWorkOrderStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkOrders();
  }, [filters]);

  const handleRefresh = () => {
    fetchWorkOrders(true);
  };

  const handleWorkOrderPress = (workOrder) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
  };

  // Filter pending work orders for inbox
  const pendingWorkOrders = workOrders.filter(wo => 
    wo.status === 'pending' && 
    (searchQuery === '' || 
     wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search work orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {pendingWorkOrders.length === 0 && !isLoading ? (
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
            All caught up! New service requests will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingWorkOrders}
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
  searchContainer: {
    padding: 16,
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

