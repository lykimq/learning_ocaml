import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Title, Card, Text, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import HomeGroupList from './HomeGroupList';
import HomeGroupForm from './HomeGroupForm';
import HomeGroupMemberList from './HomeGroupMemberList';


const ManageHomeGroupScreen = ({ route }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  // Reset to main menu when tab is pressed
  useEffect(() => {
    if (route.params?.reset) {
      setSelectedOption(null);
    }
  }, [route.params?.reset]);


  const renderContent = () => {
    switch (selectedOption) {
      case 'add':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => setSelectedOption(null)}
              />
              <Title style={styles.headerTitle}>Add New Home Group</Title>
            </View>
            <HomeGroupForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => setSelectedOption(null)}
              />
              <Title style={styles.headerTitle}>Manage Home Groups</Title>
            </View>
            <HomeGroupList />
          </View>
        );
      case 'members':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => setSelectedOption(null)}
              />
              <Title style={styles.headerTitle}>Manage Members</Title>
            </View>
            <HomeGroupMemberList />
          </View>
        );
      default:
        return (
          <View style={styles.optionsContainer}>
            <Title style={styles.mainTitle}>Home Group Management</Title>

            <Card style={styles.card} onPress={() => setSelectedOption('add')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="add-circle" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Add New Home Group</Title>
                <Text style={styles.cardDescription}>Create a new home group for church fellowship</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('list')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="event" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>View & Manage Home Groups</Title>
                <Text style={styles.cardDescription}>View, edit, or delete existing home groups</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('members')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="people" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Manage Members</Title>
                <Text style={styles.cardDescription}>View, edit, or delete existing members</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
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



export default ManageHomeGroupScreen;