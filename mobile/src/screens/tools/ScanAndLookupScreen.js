import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Card, List, Text, TextInput, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { apiService } from '../../services/api';

export default function ScanAndLookupScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!permission) {
      requestPermission().catch(() => {
        /* best effort only */
      });
    }
  }, [permission, requestPermission]);

  const lookupAsset = useCallback(async (code) => {
    if (!code) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getAssets({ search: code.trim() });
      setLookupResult(response.data?.assets?.[0] ?? null);
    } catch (err) {
      setError(err.message ?? 'Lookup failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScan = useCallback(
    ({ data }) => {
      setIsScanning(false);
      setScanResult(data);
      lookupAsset(data);
    },
    [lookupAsset],
  );

  const handleManualSubmit = () => {
    setScanResult(manualCode);
    lookupAsset(manualCode);
  };

  const handleReset = () => {
    setIsScanning(true);
    setScanResult(null);
    setLookupResult(null);
    setError(null);
  };

  const handleNavigateToWorkOrder = () => {
    if (!lookupResult?.work_order_id) {
      return;
    }
    navigation.navigate('WorkOrderDetail', { workOrderId: lookupResult.work_order_id });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text variant="titleLarge" style={styles.title}>
            Scan & Assign
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Scan an asset code to pull up its active work order or create a new request.
          </Text>
        </View>

        <View style={styles.scannerContainer}>
          {permission == null ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : permission.granted === false ? (
            <Card style={styles.permissionCard}>
              <Card.Title
                title="Camera access needed"
                subtitle="Enable camera permissions to use scanning."
              />
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => {
                    requestPermission().catch(() => {
                      /* surfaced via permission.granted */
                    });
                  }}
                >
                  Retry
                </Button>
              </Card.Actions>
            </Card>
          ) : (
            <CameraView
              onBarCodeScanned={isScanning ? handleScan : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_e', 'code93'],
              }}
              facing="back"
              style={StyleSheet.absoluteFillObject}
            />
          )}
        </View>

        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="labelLarge">Last Scan</Text>
            <Text variant="titleMedium" style={styles.scanValue}>
              {scanResult ?? '—'}
            </Text>

            <TextInput
              label="Enter code manually"
              value={manualCode}
              onChangeText={setManualCode}
              mode="outlined"
              style={styles.input}
              right={<TextInput.Icon icon="send" onPress={handleManualSubmit} />}
            />

            {isLoading ? <ActivityIndicator size="small" style={styles.loading} /> : null}

            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            ) : null}

            {lookupResult ? (
              <View style={styles.lookupContainer}>
                <List.Item
                  title={lookupResult.name ?? lookupResult.title ?? 'Asset'}
                  description={lookupResult.asset_code ?? lookupResult.work_order_number}
                  left={(props) => <List.Icon {...props} icon="cube-scan" />}
                />
                {lookupResult.work_order_id ? (
                  <Button mode="contained" icon="clipboard-text" onPress={handleNavigateToWorkOrder}>
                    Open Work Order
                  </Button>
                ) : (
                  <Button
                    icon="plus-circle"
                    onPress={() => navigation.navigate('WorkOrders', { filter: 'all' })}
                  >
                    Create work order
                  </Button>
                )}
              </View>
            ) : null}

            <Button onPress={handleReset} icon="refresh" style={styles.resetButton}>
              Scan again
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  headerSection: {
    gap: 4,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 0,
  },
  scannerContainer: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  permissionCard: {
    width: '100%',
  },
  resultCard: {
    width: '100%',
  },
  scanValue: {
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 12,
  },
  loading: {
    marginVertical: 8,
  },
  errorText: {
    marginBottom: 12,
  },
  lookupContainer: {
    marginTop: 4,
    gap: 12,
  },
  resetButton: {
    marginTop: 12,
  },
});
