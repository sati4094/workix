import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
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
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';

import { useWorkOrderStore } from '../../store/workOrderStore';
import { apiService } from '../../services/api';

export default function WorkOrderDetailScreen({ route, navigation }) {
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

  useEffect(() => {
    fetchWorkOrderById(workOrderId);
  }, [workOrderId]);

  const handleStatusChange = async (newStatus) => {
    setStatusMenuVisible(false);
    
    const result = await updateWorkOrderStatus(workOrderId, newStatus);
    
    if (result.success) {
      Alert.alert('Success', `Work order status updated to ${newStatus}`);
      fetchWorkOrderById(workOrderId);
    } else {
      Alert.alert('Error', result.error || 'Failed to update status');
    }
  };

  const handleEnhanceText = async (text, setText, context) => {
    if (!text || text.trim().length === 0) {
      Alert.alert('Error', 'Please enter some text first');
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
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
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

    const activityData = {
      activity_type: activityType,
      description,
      ai_enhanced: originalText !== description,
      original_text: originalText || null,
    };

    // Only include pictures if there are photos
    if (photos.length > 0) {
      activityData.pictures = photos;
    }

    const result = await addActivity(workOrderId, activityData);

    if (result.success) {
      // Clear fields
      if (activityType === 'observation') setObservationText('');
      if (activityType === 'action_taken') setActionText('');
      if (activityType === 'recommendation') setRecommendationText('');
      setPhotos([]);
      
      Alert.alert('Success', 'Activity added successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to add activity');
    }
  };

  if (isLoading || !currentWorkOrder) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const wo = currentWorkOrder;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {wo.work_order_number}
          </Text>
          <Text variant="titleLarge" style={styles.title}>
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
          <Menu.Item onPress={() => handleStatusChange('acknowledged')} title="Acknowledge" />
          <Menu.Item onPress={() => handleStatusChange('in_progress')} title="Start Work" />
          <Menu.Item onPress={() => handleStatusChange('parts_pending')} title="Parts Pending" />
          <Divider />
          <Menu.Item onPress={() => handleStatusChange('completed')} title="Complete" />
        </Menu>
      </View>

      <ScrollView style={styles.content}>
        {/* Status & Priority */}
        <View style={styles.statusSection}>
          <Chip icon="information" style={styles.chip}>
            {wo.status.replace('_', ' ').toUpperCase()}
          </Chip>
          <Chip icon="alert" style={styles.chip}>
            Priority: {wo.priority.toUpperCase()}
          </Chip>
        </View>

        {/* Site, Building & Enterprise Info */}
        <Card style={styles.card}>
          <Card.Title
            title="Location Information"
            left={(props) => <MaterialCommunityIcons name="map-marker" size={24} {...props} />}
          />
          <Card.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Enterprise: {wo.enterprise_name || wo.client_name}
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>{wo.site_name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {wo.site_address}
            </Text>
            {wo.building_name && (
              <Text variant="bodySmall" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
                Building: {wo.building_name}
              </Text>
            )}
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
              title="Assets"
              left={(props) => <MaterialCommunityIcons name="package-variant" size={24} {...props} />}
            />
            <Card.Content>
              {wo.assets.map((asset, index) => (
                <View key={asset.id} style={styles.assetItem}>
                  <Text variant="bodyMedium">{asset.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {asset.asset_tag} • {asset.type}
                  </Text>
                  {asset.model && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {asset.manufacturer} {asset.model}
                    </Text>
                  )}
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
            title="Observation & Root Cause Analysis"
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
            />
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="sparkles"
                onPress={() => handleEnhanceText(observationText, setObservationText, 'observation')}
                loading={isEnhancing}
                disabled={isEnhancing || !observationText}
                style={{ flex: 1, marginRight: 8 }}
              >
                Enhance with AI
              </Button>
              <Button
                mode="contained"
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
                disabled={isEnhancing || !actionText}
                style={{ flex: 1, marginRight: 8 }}
              >
                Enhance with AI
              </Button>
              <Button
                mode="contained"
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
                disabled={isEnhancing || !recommendationText}
                style={{ flex: 1, marginRight: 8 }}
              >
                Enhance with AI
              </Button>
              <Button
                mode="contained"
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
            left={(props) => <MaterialCommunityIcons name="camera" size={24} {...props} />}
          />
          <Card.Content>
            <View style={styles.photoButtons}>
              <Button icon="camera" mode="outlined" onPress={handleTakePhoto} style={{ flex: 1, marginRight: 8 }}>
                Take Photo
              </Button>
              <Button icon="image" mode="outlined" onPress={handleAddPhoto} style={{ flex: 1 }}>
                Choose Photo
              </Button>
            </View>
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((uri, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photo} />
                    <IconButton
                      icon="close-circle"
                      size={20}
                      style={styles.removePhotoButton}
                      onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Activity History */}
        {wo.activities && wo.activities.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Activity History"
              left={(props) => <MaterialCommunityIcons name="history" size={24} {...props} />}
            />
            <Card.Content>
              {wo.activities.map((activity, index) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityHeader}>
                    <Chip style={styles.activityTypeChip} textStyle={{ fontSize: 11 }}>
                      {activity.activity_type.replace('_', ' ').toUpperCase()}
                    </Chip>
                    {activity.ai_enhanced && (
                      <Chip icon="sparkles" style={styles.aiChip} textStyle={{ fontSize: 11 }}>
                        AI Enhanced
                      </Chip>
                    )}
                  </View>
                  <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                    {activity.description}
                  </Text>
                  <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                    By {activity.created_by} • {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                  </Text>
                  {index < wo.activities.length - 1 && <Divider style={{ marginTop: 12 }} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  },
  title: {
    marginTop: 4,
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
    marginBottom: 12,
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
  },
  activityItem: {
    marginBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeChip: {
    marginRight: 8,
    height: 24,
  },
  aiChip: {
    height: 24,
    backgroundColor: '#8b5cf6',
  },
});

