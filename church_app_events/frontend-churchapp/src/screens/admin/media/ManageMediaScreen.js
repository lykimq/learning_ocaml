import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Title, Card, Text, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MediaList from './MediaList';
import MediaForm from './MediaForm';
import WatchHistoryList from './WatchHistoryList';
import MediaDetails from './MediaDetails';

const Stack = createStackNavigator();

const Header = ({ title, onBackPress, hideTitle, hideBackButton }) => {
  if (!onBackPress) {
    throw new Error('Missing required prop: onBackPress');
  }

  return (
    <View style={styles.headerContainer}>
      {!hideBackButton && (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBackPress}
        />
      )}
      {!hideTitle && title && (
        <Title style={styles.headerTitle}>{title}</Title>
      )}
    </View>
  );
};

const MainMediaScreen = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const renderContent = () => {
    switch (selectedOption) {
      case 'add':
        return (
          <View style={styles.contentContainer}>
            <Header
              title="Add New Media"
              onBackPress={() => setSelectedOption(null)}
              hideTitle={true}
              hideBackButton={true}
            />
            <MediaForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <Header
              title="Manage Media Content"
              onBackPress={() => setSelectedOption(null)}
              hideTitle={true}
              hideBackButton={true}
            />
            <MediaList navigation={navigation} />
          </View>
        );
      case 'history':
        return (
          <View style={styles.contentContainer}>
            <Header
              title="Watch History"
              onBackPress={() => setSelectedOption(null)}
              hideTitle={true}
              hideBackButton={true}
            />
            <WatchHistoryList />
          </View>
        );
      default:
        return (
          <View style={styles.optionsContainer}>
            <Title style={styles.mainTitle}>Media Management</Title>

            <Card style={styles.card} onPress={() => setSelectedOption('add')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="add-circle" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Add New Media</Title>
                <Text style={styles.cardDescription}>Upload and create new media content</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('list')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="video-library" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>View & Manage Media</Title>
                <Text style={styles.cardDescription}>View, edit, or delete existing media content</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('history')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="history" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Watch History</Title>
                <Text style={styles.cardDescription}>View and manage user watch history</Text>
              </Card.Content>
            </Card>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const ManageMediaScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainMedia"
        component={MainMediaScreen}
      />
      <Stack.Screen
        name="MediaDetails"
        component={MediaDetails}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    marginLeft: 10,
  },
  optionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#4A90E2',
  },
  card: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardContent: {
    alignItems: 'center',
    padding: 20,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 18,
    color: '#333',
  },
  cardDescription: {
    marginTop: 5,
    color: '#666',
    textAlign: 'center',
  },
});

export default ManageMediaScreen;
