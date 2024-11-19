// HeaderBanner.js
import React from 'react';
import {View, Text, StyleSheet, ImageBackground} from 'react-native';

const Header = () => {
  return (
    <ImageBackground
      source={{uri: '../../asserts/pics/header.jpg'}}
      style={styles.banner}
    >
      <Text style={styles.bannerText}>Welcome to the User Dashboard</Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create ({
  banner: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
});

export default Header;
