import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { apiService } from '../../services/api';

export default function PPMScheduleScreen() {
  const theme = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const fromDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const response = await apiService.getPPMSchedules({
        from_date: fromDate,
        to_date: toDate,
        limit: 100,
      });

      setSchedules(response.data.ppm_schedules);
    } catch (error) {
      console.error('Failed to fetch PPM schedules:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSchedules(true);
  };

  const statusColors = {
    scheduled: '#3b82f6',
    in_progress: '#f59e0b',
    completed: '#22c55e',
    skipped: '#64748b',
    overdue: '#dc2626',
  };

  const renderScheduleCard = ({ item }) => {
    const statusColor = statusColors[item.status];
    const isOverdue = new Date(item.scheduled_date) < new Date() && item.status === 'scheduled';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {format(new Date(item.scheduled_date), 'EEEE, MMM dd, yyyy')}
              </Text>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.ppm_plan_name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.site_name}
              </Text>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: isOverdue ? statusColors.overdue : statusColor }]}
              textStyle={{ color: 'white', fontSize: 11 }}
            >
              {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
            </Chip>
          </View>

          <View style={styles.assetContainer}>
            <MaterialCommunityIcons name="package-variant" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
              {item.asset_name} ({item.asset_tag})
            </Text>
          </View>

          {item.estimated_duration_minutes && (
            <View style={styles.durationContainer}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                Est. Duration: {item.estimated_duration_minutes} minutes
              </Text>
            </View>
          )}

          {item.tasks_checklist && (
            <View style={styles.tasksContainer}>
              <Text variant="labelSmall" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
                Tasks ({item.tasks_checklist.length}):
              </Text>
              {item.tasks_checklist.slice(0, 3).map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <MaterialCommunityIcons
                    name="checkbox-blank-circle-outline"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text variant="bodySmall" style={{ marginLeft: 8, flex: 1 }}>
                    {task.task}
                  </Text>
                </View>
              ))}
              {item.tasks_checklist.length > 3 && (
                <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.primary }}>
                  +{item.tasks_checklist.length - 3} more tasks
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {schedules.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleLarge" style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
            No PPM Scheduled
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            No preventive maintenance tasks scheduled for this month.
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleCard}
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
  listContent: {
    padding: 16,
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
  assetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tasksContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

