import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { useSyncTelemetry } from '../../hooks/useSyncTelemetry';
import { SyncStatusPill } from '../../components/SyncStatusPill';

const priorityPalette = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

function SwipeActionButton({ label, icon, color, onPress }) {
  return (
    <RectButton style={[styles.swipeButton, { backgroundColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={26} color="#fff" />
      <Text style={styles.swipeLabel}>{label}</Text>
    </RectButton>
  );
}

function TechnicianCard({ workOrder, onNavigate, onQuickAction }) {
  const theme = useTheme();
  const priorityColor = priorityPalette[workOrder.priority] ?? theme.colors.primary;

  const handleAccept = () => onQuickAction(workOrder, 'acknowledged');
  const handleStart = () => onQuickAction(workOrder, 'in_progress');

  const renderLeftActions = useCallback(
    () => (
      <SwipeActionButton
        label="Accept"
        icon="handshake"
        color="#2563eb"
        onPress={handleAccept}
      />
    ),
    [handleAccept],
  );

  const renderRightActions = useCallback(
    () => (
      <SwipeActionButton
        label="Start"
        icon="rocket-launch"
        color="#16a34a"
        onPress={handleStart}
      />
    ),
    [handleStart],
  );

  return (
    <Swipeable renderLeftActions={renderLeftActions} renderRightActions={renderRightActions} overshootLeft={false} overshootRight={false}>
      <Card style={styles.card} onPress={() => onNavigate(workOrder)}>
        <Card.Title
          title={workOrder.title}
          titleNumberOfLines={2}
          subtitle={`${workOrder.work_order_number} • ${workOrder.site_name}`}
          left={(props) => (
            <Avatar.Text
              {...props}
              label={(workOrder.priority ?? 'P').substring(0, 1).toUpperCase()}
              style={{ backgroundColor: priorityColor }}
            />
          )}
          right={(props) => (
            <IconButton
              {...props}
              icon="chevron-right"
              onPress={() => onNavigate(workOrder)}
              accessibilityLabel="Open work order"
            />
          )}
        />
        <Card.Content>
          {workOrder.description ? (
            <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
              {workOrder.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Chip style={[styles.priorityChip, { backgroundColor: priorityColor + '30' }]} textStyle={{ color: priorityColor }}>
              {workOrder.priority?.toUpperCase() ?? 'UNSET'}
            </Chip>
            {workOrder.hazard_summary ? (
              <Chip icon="alert" style={styles.hazardChip} textStyle={{ color: theme.colors.error }}>
                {workOrder.hazard_summary}
              </Chip>
            ) : null}
            {workOrder.distance_km ? (
              <Chip icon="map-marker-distance" style={styles.hazardChip}>
                {workOrder.distance_km.toFixed(1)} km away
              </Chip>
            ) : null}
          </View>
        </Card.Content>
        <Card.Actions>
          <Button icon="hand-back-left" onPress={handleAccept}>
            Accept
          </Button>
          <Button icon="play" mode="contained" onPress={handleStart}>
            Start
          </Button>
        </Card.Actions>
      </Card>
    </Swipeable>
  );
}

export default function TechnicianHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { workOrders, fetchWorkOrders, isRefreshing, updateWorkOrderStatus } = useWorkOrderStore();
  const telemetry = useSyncTelemetry();

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const pendingWorkOrders = useMemo(
    () =>
      workOrders
        .filter((wo) => wo.status === 'pending')
        .sort((a, b) => {
          const priorityOrder = ['critical', 'high', 'medium', 'low'];
          const indexA = priorityOrder.indexOf(a.priority);
          const indexB = priorityOrder.indexOf(b.priority);
          const priorityDiff = (indexA === -1 ? priorityOrder.length : indexA) -
            (indexB === -1 ? priorityOrder.length : indexB);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          return new Date(a.created_at) - new Date(b.created_at);
        }),
    [workOrders],
  );

  const metrics = useMemo(() => {
    const critical = pendingWorkOrders.filter((wo) => wo.priority === 'critical').length;
    const high = pendingWorkOrders.filter((wo) => wo.priority === 'high').length;
    return { total: pendingWorkOrders.length, critical, high };
  }, [pendingWorkOrders]);

  const handleNavigate = useCallback(
    (workOrder) => {
      navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
    },
    [navigation],
  );

  const handleQuickAction = useCallback(
    async (workOrder, nextStatus) => {
      const result = await updateWorkOrderStatus(workOrder.id, nextStatus, { optimistic: true });
      if (!result.success) {
        Alert.alert('Update failed', result.error || 'Unable to update work order status.');
      }
    },
    [updateWorkOrderStatus],
  );

  const renderItem = ({ item }) => (
    <TechnicianCard workOrder={item} onNavigate={handleNavigate} onQuickAction={handleQuickAction} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge">Technician Queue</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Swipe to accept or start priority jobs.
          </Text>
        </View>
        <SyncStatusPill status={telemetry.status} queueSize={telemetry.queueSize} lastSync={telemetry.lastSync} />
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderColor: '#2563eb' }]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={styles.metricValue}>{metrics.total}</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#dc2626' }]}>
          <Text style={styles.metricLabel}>Critical</Text>
          <Text style={styles.metricValue}>{metrics.critical}</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: '#f97316' }]}>
          <Text style={styles.metricLabel}>High</Text>
          <Text style={styles.metricValue}>{metrics.high}</Text>
        </View>
      </View>

      <FlatList
        data={pendingWorkOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={() => fetchWorkOrders(true)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="inbox-arrow-down" size={72} color={theme.colors.outline} />
            <Text variant="titleMedium" style={{ marginTop: 12 }}>
              All caught up
            </Text>
            <Text variant="bodyMedium" style={styles.emptyCopy}>
              New work orders will land here for quick triage.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  hazardChip: {
    height: 28,
  },
  swipeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
  },
  swipeLabel: {
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
