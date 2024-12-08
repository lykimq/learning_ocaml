import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Title, Card, Text, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import HomeGroupList from './HomeGroupList';
import HomeGroupForm from './HomeGroupForm';
import HomeGroupMemberList from './HomeGroupMemberList';
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


const ManageHomeGroupScreen = ({ route }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
  gestureEnabled: true,
    });
  }, [navigation]);


  const renderContent = () => {
    switch (selectedOption) {
      case 'add':
        return (
          <View style={styles.contentContainer}>
            <Header title="Add New Home Group" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <HomeGroupForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Home Groups" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <HomeGroupList />
          </View>
        );
      case 'members':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Members" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
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

const COLORS = {
  background: '#f5f5f5',
  white: '#fff',
  border: '#e0e0e0',
  text: '#333',
  icon: '#4A90E2',
  error: '#f44336',
  errorBorder: '#f44336',
  chipText: '#666',
  chipSelected: '#4A90E2',
  filterButton: '#4A90E2',
  filterButtonText: '#fff',
  shadow: 'rgba(0, 0, 0, 0.1)', // shadow color
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor:  COLORS.border,
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
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
  },
  cardDescription: {
    marginTop: 5,
    color: COLORS.text,
    textAlign: 'center',
  },
});



export default ManageHomeGroupScreen;