import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';

const STATUS_COPY = {
  idle: { label: 'Up to date', icon: 'cloud-check-outline' },
  syncing: { label: 'Syncing…', icon: 'cloud-sync' },
  offline: { label: 'Offline mode', icon: 'cloud-off-outline' },
  error: { label: 'Sync issue', icon: 'cloud-alert' },
};

export function SyncStatusPill({ status = 'idle', queueSize = 0, lastSync, onPress }) {
  const theme = useTheme();
  const copy = STATUS_COPY[status] ?? STATUS_COPY.idle;

  return (
    <View style={styles.container}>
      <Chip
        icon={copy.icon}
        style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
        textStyle={styles.text}
        onPress={onPress}
      >
        {copy.label}
        {queueSize > 0 ? ` • ${queueSize}` : ''}
      </Chip>
      {lastSync ? (
        <Text variant="bodySmall" style={styles.subtle}>
          Last sync {new Date(lastSync).toLocaleTimeString()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 4,
  },
  text: {
    fontWeight: '600',
  },
  subtle: {
    marginTop: 4,
    opacity: 0.7,
  },
});
