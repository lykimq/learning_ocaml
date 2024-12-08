import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Title, Card, Text, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ServingList from './ServingList';
import ServingForm from './ServingForm';
import ServingMemberList from './ServingMemberList';
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

const ManageServingScreen = ({ route }) => {
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
            <Header title="Add New Serving Opportunity" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <ServingForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Serving Opportunities" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <ServingList />
          </View>
        );
      case 'members':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Serving Members" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <ServingMemberList />
          </View>
        );
      default:
        return (
          <View style={styles.optionsContainer}>
            <Title style={styles.mainTitle}>Serving Management</Title>

            <Card style={styles.card} onPress={() => setSelectedOption('add')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="add-circle" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Add New Serving Opportunity</Title>
                <Text style={styles.cardDescription}>Create a new serving opportunity for church activities</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('list')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="event" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>View & Manage Serving Opportunities</Title>
                <Text style={styles.cardDescription}>View, edit, or delete existing serving opportunities</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('members')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="people" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Manage Serving Members</Title>
                <Text style={styles.cardDescription}>View, edit, or delete existing serving members</Text>
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
    flexDirection:'row',
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

export default ManageServingScreen;
