import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Chip,
  Card,
  IconButton,
  ActivityIndicator,
  useTheme,
  Menu,
  Divider,
  ProgressBar,
  Banner,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import NetInfo from '@react-native-community/netinfo';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { apiService } from '../../services/api';
import { ImageGallery } from '../../components/ImageGallery';

export default function EnhancedWorkOrderDetail({ route, navigation }) {
  const { workOrderId } = route.params;
  const theme = useTheme();
  
  const { currentWorkOrder, fetchWorkOrderById, updateWorkOrderStatus, addActivity, isLoading } = useWorkOrderStore();
  
  const [activeTab, setActiveTab] = useState('details');
  const [observationText, setObservationText] = useState('');
  const [actionText, setActionText] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkOrderById(workOrderId);
    
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, [workOrderId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkOrderById(workOrderId);
    setRefreshing(false);
  };

  const handleStatusChange = async (newStatus) => {
    setStatusMenuVisible(false);
    
    const statusNames = {
      'acknowledged': 'Acknowledge',
      'in_progress': 'Start Work',
      'parts_pending': 'Mark Parts Pending',
      'completed': 'Complete Work Order',
      'cancelled': 'Cancel Work Order'
    };

    Alert.alert(
      statusNames[newStatus] || 'Update Status',
      `Are you sure you want to ${statusNames[newStatus]?.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await updateWorkOrderStatus(workOrderId, newStatus);
            
            if (result.success) {
              Alert.alert('Success', `Work order status updated to ${newStatus.replace('_', ' ')}`);
              fetchWorkOrderById(workOrderId);
            } else {
              Alert.alert('Error', result.error || 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const handleEnhanceText = async (text, setText, context) => {
    if (!text || text.trim().length === 0) {
      Alert.alert('Error', 'Please enter some text first');
      return;
    }

    if (!isOnline) {
      Alert.alert('Offline', 'AI enhancement requires internet connection');
      return;
    }

    try {
      setIsEnhancing(true);
      const response = await apiService.enhanceText(text, context);
      setText(response.data.enhanced);
      Alert.alert('Success', 'Text enhanced successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to enhance text');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleSubmitActivity = async (activityType, description, originalText) => {
    if (!description || description.trim().length === 0) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    const result = await addActivity(workOrderId, {
      activity_type: activityType,
      description,
      ai_enhanced: originalText !== description,
      original_text: originalText || null,
      ...(photos.length > 0 && { pictures: photos }),
    });

    if (result.success) {
      // Clear fields
      if (activityType === 'observation') setObservationText('');
      if (activityType === 'action_taken') setActionText('');
      if (activityType === 'recommendation') setRecommendationText('');
      setPhotos([]);
      
      Alert.alert('Success', 'Activity added successfully');
      fetchWorkOrderById(workOrderId);
    } else {
      Alert.alert('Error', result.error || 'Failed to add activity');
    }
  };

  if (isLoading || !currentWorkOrder) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading work order...</Text>
      </View>
    );
  }

  const wo = currentWorkOrder;
  const completionPercentage = 
    wo.status === 'completed' ? 100 :
    wo.status === 'in_progress' ? 60 :
    wo.status === 'acknowledged' ? 30 :
    wo.status === 'parts_pending' ? 75 : 10;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Offline Banner */}
      {!isOnline && (
        <Banner visible={!isOnline} icon="cloud-off-outline">
          You're offline. Changes will sync when connection is restored.
        </Banner>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {wo.work_order_number}
          </Text>
          <Text variant="titleLarge" style={styles.title} numberOfLines={2}>
            {wo.title}
          </Text>
        </View>
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setStatusMenuVisible(true)}
            />
          }
        >
          {wo.status === 'pending' && (
            <Menu.Item onPress={() => handleStatusChange('acknowledged')} title="Acknowledge" leadingIcon="check" />
          )}
          {(wo.status === 'acknowledged' || wo.status === 'pending') && (
            <Menu.Item onPress={() => handleStatusChange('in_progress')} title="Start Work" leadingIcon="play" />
          )}
          {(wo.status === 'in_progress' || wo.status === 'acknowledged') && (
            <Menu.Item onPress={() => handleStatusChange('parts_pending')} title="Parts Pending" leadingIcon="package-variant" />
          )}
          <Divider />
          {(wo.status === 'in_progress' || wo.status === 'parts_pending') && (
            <Menu.Item onPress={() => handleStatusChange('completed')} title="Complete" leadingIcon="check-circle" />
          )}
        </Menu>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text variant="labelSmall" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>
          Progress: {completionPercentage}%
        </Text>
        <ProgressBar progress={completionPercentage / 100} color={theme.colors.primary} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status & Priority */}
        <View style={styles.statusSection}>
          <Chip icon="information" style={[styles.chip, getStatusChipStyle(wo.status)]}>
            {wo.status.replace('_', ' ').toUpperCase()}
          </Chip>
          <Chip icon="alert" style={[styles.chip, getPriorityChipStyle(wo.priority)]}>
            {wo.priority.toUpperCase()}
          </Chip>
        </View>

        {/* Site & Client Info */}
        <Card style={styles.card}>
          <Card.Title
            title="Site Information"
            left={(props) => <MaterialCommunityIcons name="map-marker" size={24} {...props} />}
          />
          <Card.Content>
            <Text variant="titleMedium">{wo.site_name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {wo.site_address}
            </Text>
            <Divider style={{ marginVertical: 12 }} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Client: {wo.client_name}
            </Text>
            {wo.site_contact_person && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Contact: {wo.site_contact_person} • {wo.site_contact_phone}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Assets */}
        {wo.assets && wo.assets.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title={`Assets (${wo.assets.length})`}
              left={(props) => <MaterialCommunityIcons name="package-variant" size={24} {...props} />}
            />
            <Card.Content>
              {wo.assets.map((asset, index) => (
                <View key={asset.id} style={styles.assetItem}>
                  <View style={styles.assetIcon}>
                    <MaterialCommunityIcons 
                      name={getAssetIcon(asset.type)} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall">{asset.name}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {asset.asset_tag} • {asset.type}
                    </Text>
                    {asset.model && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {asset.manufacturer} {asset.model}
                      </Text>
                    )}
                  </View>
                  {index < wo.assets.length - 1 && <Divider style={{ marginVertical: 12 }} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Description */}
        {wo.description && (
          <Card style={styles.card}>
            <Card.Title
              title="Issue Description"
              left={(props) => <MaterialCommunityIcons name="text" size={24} {...props} />}
            />
            <Card.Content>
              <Text variant="bodyMedium">{wo.description}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Observation & RCA */}
        <Card style={styles.card}>
          <Card.Title
            title="Observation & Root Cause"
            subtitle="Document what you found"
            left={(props) => <MaterialCommunityIcons name="eye" size={24} {...props} />}
          />
          <Card.Content>
            <TextInput
              label="Enter your observations"
              value={observationText}
              onChangeText={setObservationText}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textInput}
              disabled={!isOnline && isEnhancing}
            />
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="sparkles"
                onPress={() => handleEnhanceText(observationText, setObservationText, 'observation')}
                loading={isEnhancing}
                disabled={isEnhancing || !observationText || !isOnline}
                style={{ flex: 1, marginRight: 8 }}
              >
                {isOnline ? 'AI Enhance' : 'Offline'}
              </Button>
              <Button
                mode="contained"
                icon="send"
                onPress={() => handleSubmitActivity('observation', observationText, observationText)}
                disabled={!observationText}
                style={{ flex: 1 }}
              >
                Submit
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Action Taken */}
        <Card style={styles.card}>
          <Card.Title
            title="Action Taken"
            subtitle="What did you do?"
            left={(props) => <MaterialCommunityIcons name="wrench" size={24} {...props} />}
          />
          <Card.Content>
            <TextInput
              label="Describe actions taken"
              value={actionText}
              onChangeText={setActionText}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="sparkles"
                onPress={() => handleEnhanceText(actionText, setActionText, 'action_taken')}
                loading={isEnhancing}
                disabled={isEnhancing || !actionText || !isOnline}
                style={{ flex: 1, marginRight: 8 }}
              >
                AI Enhance
              </Button>
              <Button
                mode="contained"
                icon="send"
                onPress={() => handleSubmitActivity('action_taken', actionText, actionText)}
                disabled={!actionText}
                style={{ flex: 1 }}
              >
                Submit
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recommendations */}
        <Card style={styles.card}>
          <Card.Title
            title="Recommendations"
            subtitle="What should be done next?"
            left={(props) => <MaterialCommunityIcons name="lightbulb" size={24} {...props} />}
          />
          <Card.Content>
            <TextInput
              label="Enter recommendations"
              value={recommendationText}
              onChangeText={setRecommendationText}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textInput}
            />
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="sparkles"
                onPress={() => handleEnhanceText(recommendationText, setRecommendationText, 'recommendation')}
                loading={isEnhancing}
                disabled={isEnhancing || !recommendationText || !isOnline}
                style={{ flex: 1, marginRight: 8 }}
              >
                AI Enhance
              </Button>
              <Button
                mode="contained"
                icon="send"
                onPress={() => handleSubmitActivity('recommendation', recommendationText, recommendationText)}
                disabled={!recommendationText}
                style={{ flex: 1 }}
              >
                Submit
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Photos */}
        <Card style={styles.card}>
          <Card.Title
            title="Photos"
            subtitle={photos.length > 0 ? `${photos.length} photo(s) selected` : 'Add documentation photos'}
            left={(props) => <MaterialCommunityIcons name="camera" size={24} {...props} />}
          />
          <Card.Content>
            <View style={styles.photoButtons}>
              <Button 
                icon="camera" 
                mode="outlined" 
                onPress={handleTakePhoto} 
                style={{ flex: 1, marginRight: 8 }}
              >
                Take Photo
              </Button>
              <Button 
                icon="image" 
                mode="outlined" 
                onPress={handleAddPhoto} 
                style={{ flex: 1 }}
              >
                Gallery
              </Button>
            </View>
            
            {/* Image Gallery Component */}
            <ImageGallery images={photos} />
            
            {photos.length > 0 && (
              <Button
                mode="text"
                icon="delete"
                onPress={() => setPhotos([])}
                textColor={theme.colors.error}
              >
                Clear All Photos
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Activity History with Images */}
        {wo.activities && wo.activities.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title={`Activity History (${wo.activities.length})`}
              left={(props) => <MaterialCommunityIcons name="history" size={24} {...props} />}
            />
            <Card.Content>
              {wo.activities.map((activity, index) => {
                const userName = activity.created_by_name || activity.created_by || 'System';
                const activityImages = activity.pictures && Array.isArray(activity.pictures) ? activity.pictures : [];
                
                return (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityHeader}>
                      <Chip style={styles.activityTypeChip} textStyle={{ fontSize: 11 }}>
                        {activity.activity_type.replace('_', ' ').toUpperCase()}
                      </Chip>
                      {activity.ai_enhanced && (
                        <Chip icon="sparkles" style={styles.aiChip} textStyle={{ fontSize: 11, color: 'white' }}>
                          AI Enhanced
                        </Chip>
                      )}
                    </View>
                    <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                      {activity.description}
                    </Text>
                    
                    {/* Show image gallery if pictures exist */}
                    {activityImages.length > 0 && (
                      <ImageGallery images={activityImages} />
                    )}
                    
                    <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                      By {userName} • {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                    </Text>
                    {index < wo.activities.length - 1 && <Divider style={{ marginTop: 12 }} />}
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
const getStatusChipStyle = (status) => {
  const colors = {
    pending: { backgroundColor: '#94a3b8' },
    acknowledged: { backgroundColor: '#3b82f6' },
    in_progress: { backgroundColor: '#f59e0b' },
    parts_pending: { backgroundColor: '#8b5cf6' },
    completed: { backgroundColor: '#22c55e' },
    cancelled: { backgroundColor: '#64748b' },
  };
  return colors[status] || {};
};

const getPriorityChipStyle = (priority) => {
  const colors = {
    low: { backgroundColor: '#22c55e' },
    medium: { backgroundColor: '#f59e0b' },
    high: { backgroundColor: '#f97316' },
    critical: { backgroundColor: '#dc2626' },
  };
  return colors[priority] || {};
};

const getAssetIcon = (type) => {
  const icons = {
    chiller: 'snowflake',
    ahu: 'fan',
    pump: 'water-pump',
    cooling_tower: 'tower-fire',
    boiler: 'fire',
    vfd: 'flash',
    motor: 'engine',
    compressor: 'air-filter',
  };
  return icons[type] || 'package-variant';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'white',
  },
  title: {
    marginTop: 4,
  },
  progressContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  statusSection: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  photoButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityItem: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activityTypeChip: {
    marginRight: 8,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  aiChip: {
    height: 24,
    backgroundColor: '#8b5cf6',
  },
});

