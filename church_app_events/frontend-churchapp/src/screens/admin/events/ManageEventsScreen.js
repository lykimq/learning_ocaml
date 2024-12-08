import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Card, Title, IconButton } from 'react-native-paper';
import EventForm from './EventForm';
import EventsList from './EventsList';
import EventRsvpList from './EventRsvpList';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

/**
 * A simple header component for the ManageEventsScreen.
 *
 * @param {string} title The title to display in the header.
 * @param {function} onBackPress The function to call when the back button is pressed.
 */
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

const ManageEventsScreen = () => {
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
            <Header title="Add New Event" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <EventForm onSubmit={() => setSelectedOption(null)} />
          </View>
        );
      case 'list':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage Events" onBackPress={() => setSelectedOption(null)} hideTitle={true} hideBackButton={true} />
            <EventsList />
          </View>
        );
      case 'rsvp':
        return (
          <View style={styles.contentContainer}>
            <Header title="Manage RSVPs" onBackPress={() => setSelectedOption(null)} hideTitle ={true} hideBackButton={true}  />
            <EventRsvpList />
          </View>
        );
      default:
        return (
          <View style={styles.optionsContainer}>
            <Title style={styles.mainTitle}>Event Management</Title>

            <Card style={styles.card} onPress={() => setSelectedOption('add')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="add-circle" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Add New Event</Title>
                <Text style={styles.cardDescription}>Create a new event for the church calendar</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('list')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="event" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Manage Events</Title>
                <Text style={styles.cardDescription}>View and edit existing events</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card} onPress={() => setSelectedOption('rsvp')}>
              <Card.Content style={styles.cardContent}>
                <MaterialIcons name="people" size={32} color="#4A90E2" />
                <Title style={styles.cardTitle}>Manage RSVPs</Title>
                <Text style={styles.cardDescription}>View and manage event RSVPs</Text>
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
    flexDirection:'row',
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

export default ManageEventsScreen;
