import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { useAuthStore } from '../../store/authStore';

const statusPalette = {
  acknowledged: '#3b82f6',
  in_progress: '#f97316',
  parts_pending: '#9333ea',
};

function SwipeAction({ label, icon, color, onPress }) {
  return (
    <RectButton style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </RectButton>
  );
}

function QueueCard({ workOrder, onNavigate, onUpdateStatus }) {
  const theme = useTheme();
  const statusColor = statusPalette[workOrder.status] ?? theme.colors.primary;

  const markInProgress = () => onUpdateStatus(workOrder, 'in_progress');
  const markCompleted = () => onUpdateStatus(workOrder, 'completed');

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipeRow}>
          <SwipeAction label="In Progress" icon="progress-clock" color="#2563eb" onPress={markInProgress} />
          <SwipeAction label="Complete" icon="check-circle" color="#16a34a" onPress={markCompleted} />
        </View>
      )}
    >
      <Card style={styles.card} onPress={() => onNavigate(workOrder)}>
        <Card.Title
          title={workOrder.title}
          subtitle={workOrder.site_name}
          right={() => (
            <Chip style={[styles.statusChip, { backgroundColor: statusColor + '30' }]} textStyle={{ color: statusColor }}>
              {workOrder.status.replace('_', ' ').toUpperCase()}
            </Chip>
          )}
        />
        <Card.Content>
          {workOrder.description ? (
            <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
              {workOrder.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Chip icon="clock-outline" style={styles.metaChip}>
              {new Date(workOrder.updated_at ?? workOrder.created_at).toLocaleTimeString()}
            </Chip>
            {workOrder.asset_count ? (
              <Chip icon="package-variant" style={styles.metaChip}>
                {workOrder.asset_count} assets
              </Chip>
            ) : null}
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={markInProgress} icon="progress-check">
            Resume
          </Button>
          <Button onPress={markCompleted} mode="contained" icon="check">
            Complete
          </Button>
        </Card.Actions>
      </Card>
    </Swipeable>
  );
}

export default function MyQueueScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, updateWorkOrderStatus, fetchWorkOrders, isRefreshing } = useWorkOrderStore();
  const { user } = useAuthStore();

  const assignments = useMemo(
    () =>
      workOrders.filter(
        (wo) => wo.assigned_to === user?.id && !['completed', 'cancelled'].includes(wo.status),
      ),
    [workOrders, user?.id],
  );

  const handleNavigate = useCallback(
    (workOrder) => {
      navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
    },
    [navigation],
  );

  const handleUpdate = useCallback(
    async (workOrder, nextStatus) => {
      const result = await updateWorkOrderStatus(workOrder.id, nextStatus, { optimistic: true });
      if (!result.success) {
        Alert.alert('Update failed', result.error || 'Unable to update progress right now.');
      }
    },
    [updateWorkOrderStatus],
  );

  const renderItem = ({ item }) => (
    <QueueCard workOrder={item} onNavigate={handleNavigate} onUpdateStatus={handleUpdate} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="titleLarge">My Active Jobs</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Swipe to quickly update progress.
        </Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={isRefreshing}
        onRefresh={() => fetchWorkOrders(true)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={70} color={theme.colors.outline} />
            <Text variant="titleMedium" style={{ marginTop: 12 }}>
              No active assignments
            </Text>
            <Text variant="bodyMedium" style={styles.emptyCopy}>
              Acknowledge jobs from the dashboard to populate your queue.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  statusChip: {
    maxHeight: 28,
  },
  description: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    height: 28,
  },
  swipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 120,
  },
  emptyCopy: {
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.7,
  },
});
