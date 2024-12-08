import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Card, Title, IconButton } from 'react-native-paper';
import UserForm from './UserForm';
import UsersList from './UsersList';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

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


const ManageUsersScreen = ({ route }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const navigation = useNavigation();

  // Reset to main menu when tab is pressed
  useEffect(() => {
    navigation.setOptions ({
      gestureEnabled: true,
    });
  }, [navigation]);

  const renderContent = () => {
    switch (selectedOption) {
      case 'add':
        return (
          <View style={styles.contentContainer}>
            <Header title="Add New User" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <UserForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Users" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <UsersList />
          </View>
        );
      default:
        return (
          <View style={styles.optionsContainer}>
            <Title style={styles.mainTitle}>User Management</Title>

            <Card style={styles.card} onPress={() => setSelectedOption('add')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="person-add" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Add New User</Title>
                <Text style={styles.cardDescription}>Create a new user account</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('list')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="people" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>View & Manage Users</Title>
                <Text style={styles.cardDescription}>View, edit, or delete user accounts</Text>
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

const COLORS = {
  background: '#f5f5f5', // light gray background
  white: '#fff', // white
  border: '#e0e0e0', // light gray border
  text: '#333', // dark gray text
  icon: '#4A90E2', // blue icon color
  card: '#fff', // white card background
  shadow: '#000', // shadow color
  hover: '#e0e0e0', // light gray hover color
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.icon,
  },
  card: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    backgroundColor: COLORS.card,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 8px ${COLORS.shadow}`,
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
    color: COLORS.text,
  },
  cardDescription: {
    marginTop: 5,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default ManageUsersScreen;
