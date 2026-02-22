import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// READVERTISING + DOUBLE/LONG PRESS + BATTERY INFO
export default function HomeScreen() {
  const [count, setCount] = useState(1);
  const [battery, setBattery] = useState('100'); // New battery state
  const [isConnected, setIsConnected] = useState(false);
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const connectToESP32 = async () => {
    try {
      setIsScanning(true);
      
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          // Included both services here
          optionalServices: ['12345678-1234-1234-1234-123456789abc', 'battery_service']
        });
        setBleDevice(device);

        device.addEventListener('gattserverdisconnected', () => {
          console.log("Device disconnected");
          setIsConnected(false);
          setBleDevice(null);
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('12345678-1234-1234-1234-123456789abc');
        const characteristic = await service.getCharacteristic('87654321-4321-4321-4321-cba987654321');

        // --- Counter Listener ---
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = new TextDecoder().decode(event.target.value).trim();
          
          if (value === 'BUTTON_PRESSED' || value === 'S') {
            setCount(prevCount => prevCount + 1);
          } else if (value === 'L') {
            setCount(prevCount => prevCount - 1);
          } else if (value === 'D') {
            setCount(prevCount => prevCount + 2);
          }
        });

        // --- Battery Listener (Merging into UI logic) ---
        try {
          const batteryService = await server.getPrimaryService('battery_service');
          const batteryChar = await batteryService.getCharacteristic('battery_level');
          await batteryChar.startNotifications();
          batteryChar.addEventListener('characteristicvaluechanged', (event: any) => {
            // Decoding the fake number string from ESP32
            const battValue = new TextDecoder().decode(event.target.value).trim();
            setBattery(battValue);
          });
        } catch (e) {
          console.log("Battery service not found, using default 100");
        }

        setIsConnected(true);
        setIsScanning(false);
        Alert.alert('Connected!', 'Successfully connected to ESP32');

      } else {
        setIsScanning(false);
        Alert.alert('Error', 'Web Bluetooth not supported');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsScanning(false);
      Alert.alert('Connection Failed', `${error}`);
    }
  };

  const disconnect = () => {
    if (bleDevice && bleDevice.gatt.connected) {
      bleDevice.gatt.disconnect();
    }
    setIsConnected(false);
    setBleDevice(null);
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.bluetoothContainer}>
        <ThemedText style={styles.statusText}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </ThemedText>
        
        {!isConnected ? (
          <TouchableOpacity 
            style={[styles.bluetoothButton, isScanning && styles.disabledButton]} 
            onPress={connectToESP32}
            disabled={isScanning}
          >
            <ThemedText style={styles.bluetoothButtonText}>
              {isScanning ? 'Connecting...' : 'Connect to ESP32'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
            <ThemedText style={styles.bluetoothButtonText}>Disconnect ESP32</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* This is what you wanted: Combined display string */}
      <ThemedView style={styles.numberContainer}>
        <ThemedText style={styles.numberText}>
          {battery}-0-{count}
        </ThemedText>
      </ThemedView>
      
      <TouchableOpacity style={styles.button} onPress={incrementCount}>
        <ThemedText style={styles.buttonText}>Manual Increment</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  bluetoothContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  statusText: { fontSize: 16, marginBottom: 10, fontWeight: '600' },
  bluetoothButton: { backgroundColor: '#28a745', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20, marginBottom: 10 },
  disabledButton: { backgroundColor: '#6c757d', opacity: 0.6 },
  disconnectButton: { backgroundColor: '#dc3545', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20, marginBottom: 10 },
  bluetoothButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  numberContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  numberText: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', lineHeight: 80 }, // Slightly smaller font to fit string
  button: { backgroundColor: '#007AFF', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 50 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});