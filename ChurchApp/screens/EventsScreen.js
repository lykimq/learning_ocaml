import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function EventsScreen () {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <Text style={styles.title}>List of church events will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
