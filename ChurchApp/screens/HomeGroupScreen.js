import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function HomeGroupScreen () {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Group</Text>
      <Text style={styles.title}>
        List of church home group will appear here.
      </Text>
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
