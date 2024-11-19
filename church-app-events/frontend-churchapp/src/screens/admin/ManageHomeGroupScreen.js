import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ManageHomeGroupScreen () {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Group Screen</Text>
      <Text style={styles.title}>Upcoming</Text>
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
