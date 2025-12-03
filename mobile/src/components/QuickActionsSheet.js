import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, IconButton, List, Modal, Portal, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

const ACTIONS = [
  {
    key: 'scan-asset',
    icon: 'qrcode-scan',
    title: 'Scan Asset',
    description: 'Identify equipment via QR or barcode.',
  },
  {
    key: 'voice-note',
    icon: 'microphone-message',
    title: 'Voice Note',
    description: 'Dictate observations hands-free.',
  },
  {
    key: 'quick-complete',
    icon: 'check-decagram',
    title: 'Quick Complete',
    description: 'Close a work order with templates.',
  },
  {
    key: 'photo-capture',
    icon: 'camera-burst',
    title: 'Capture Evidence',
    description: 'Queue photos for background upload.',
  },
];

export function QuickActionsSheet({ isVisible, onClose, onActionPress }) {
  const theme = useTheme();

  const actions = useMemo(() => ACTIONS, []);

  const handleActionPress = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    onActionPress?.(action.key);
  };

  return (
    <Portal>
      <Modal
        visible={isVisible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
        dismissable
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={4}>
          <Card.Title
            title="Quick Actions"
            subtitle="Rapid tools for field execution"
            right={(props) => (
              <IconButton {...props} icon="close" onPress={onClose} accessibilityLabel="Close quick actions" />
            )}
          />
          <Divider />
          <Card.Content>
            {actions.map((action, index) => (
              <View key={action.key}>
                <List.Item
                  title={action.title}
                  description={action.description}
                  left={(props) => <List.Icon {...props} icon={action.icon} />}
                  onPress={() => handleActionPress(action)}
                />
                {index < actions.length - 1 ? <Divider style={styles.divider} /> : null}
              </View>
            ))}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 16,
  },
  card: {
    borderRadius: 16,
  },
  divider: {
    marginHorizontal: 4,
  },
});
