import React, { useState } from 'react';
import { View, Image, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageGallery({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openImage = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const closeImage = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <View style={styles.galleryContainer}>
        <Text variant="labelMedium" style={styles.galleryTitle}>
          Photos ({images.length})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.thumbnailGrid}>
            {images.map((image, index) => {
              const imageUri = typeof image === 'string' ? image : image.uri;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => openImage(imageUri)}
                  style={styles.thumbnail}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.thumbnailOverlay}>
                    <MaterialCommunityIcons name="magnify-plus" size={24} color="white" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImage}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Image {images.indexOf(selectedImage) + 1} of {images.length}
            </Text>
            <IconButton
              icon="close"
              iconColor="white"
              size={28}
              onPress={closeImage}
            />
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <View style={styles.navigationButtons}>
              <IconButton
                icon="chevron-left"
                iconColor="white"
                size={36}
                onPress={() => {
                  const currentIndex = images.indexOf(selectedImage);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                  setSelectedImage(images[prevIndex]);
                }}
                style={styles.navButton}
              />
              <IconButton
                icon="chevron-right"
                iconColor="white"
                size={36}
                onPress={() => {
                  const currentIndex = images.indexOf(selectedImage);
                  const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                  setSelectedImage(images[nextIndex]);
                }}
                style={styles.navButton}
              />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    marginVertical: 12,
  },
  galleryTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  modalTitle: {
    color: 'white',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 150,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

