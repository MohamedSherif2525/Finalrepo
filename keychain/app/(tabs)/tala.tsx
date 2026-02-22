import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// READVERTISING + DOUBLE/LONG PRESS
export default function HomeScreen() {
  const [count, setCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [bleDevice, setBleDevice] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Web Bluetooth API for Expo compatibility
  const connectToESP32 = async () => {
    try {
      setIsScanning(true);
      
      // Check if Web Bluetooth API is available (works in Expo Web)
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
         acceptAllDevices: true,
         optionalServices: ['12345678-1234-1234-1234-123456789abc']
        });
        setBleDevice(device);

device.addEventListener('gattserverdisconnected', () => {
  console.log("Device disconnected");
  setIsConnected(false);
  setBleDevice(null);
});

        console.log('Device selected:', device.name);

        const server = await device.gatt.connect();
        console.log('Connected to GATT server');

        const service = await server.getPrimaryService('12345678-1234-1234-1234-123456789abc');
        console.log('Service found');

        const characteristic = await service.getCharacteristic('87654321-4321-4321-4321-cba987654321');
        console.log('Characteristic found');

        // Listen for notifications from ESP32
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = new TextDecoder().decode(event.target.value);
          console.log('Received from ESP32:', value);
          
          if (value.trim() === 'BUTTON_PRESSED') {
            setCount(prevCount => prevCount + 1);
            console.log('Counter incremented via ESP32 button!');
          }

           if (value.trim() === 'L') {
            setCount(prevCount => prevCount - 1);
            console.log('Counter incremented via ESP32 button!');
          }

           if (value.trim() === 'D') {
            setCount(prevCount => prevCount + 2);
            console.log('Counter incremented via ESP32 button!');
          }
        });

        setIsConnected(true);
        setIsScanning(false);
        Alert.alert('Connected!', 'Successfully connected to ESP32_Counter');

      } else {
        // Fallback for mobile apps - show instructions
        setIsScanning(false);
        Alert.alert(
          'Bluetooth Connection', 
          'For mobile devices:\n\n1. Make sure your ESP32 is running\n2. Enable Bluetooth on your phone\n3. Use the manual increment button for now\n\nFull BLE support requires a development build.'
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsScanning(false);
      Alert.alert('Connection Failed', `Could not connect to ESP32: ${error}`);
    }
  };

 const disconnect = () => {
  if (bleDevice && bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
    console.log("Manually disconnected");
  }

  setIsConnected(false);
  setBleDevice(null);

  Alert.alert('Disconnected', 'Disconnected from ESP32');
};
  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.bluetoothContainer}>
        <ThemedText style={styles.statusText}>
          Status: {isConnected ? 'Connected to ESP32' : 'Disconnected'}
        </ThemedText>
        
        {!isConnected ? (
          <TouchableOpacity 
            style={[styles.bluetoothButton, isScanning && styles.disabledButton]} 
            onPress={connectToESP32}
            disabled={isScanning}
          >
            <ThemedText style={styles.bluetoothButtonText}>
              {isScanning ? 'Connecting to ESP32...' : 'Connect to ESP32'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
            <ThemedText style={styles.bluetoothButtonText}>Disconnect ESP32</ThemedText>
          </TouchableOpacity>
        )}

        {isConnected ? (
          <ThemedText style={styles.instructionText}>
            Press the physical button on your ESP32 to increment the counter!
          </ThemedText>
        ) : (
          <ThemedText style={styles.instructionText}>
            Note: For full BLE support on mobile, a development build is required.{'\n'}
            Use manual increment below for testing.
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.numberContainer}>
        <ThemedText style={styles.numberText}>{count}</ThemedText>
      </ThemedView>
      
      <TouchableOpacity style={styles.button} onPress={incrementCount}>
        <ThemedText style={styles.buttonText}>Manual Increment</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  bluetoothContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  bluetoothButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  bluetoothButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  numberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  numberText: {
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 80,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
