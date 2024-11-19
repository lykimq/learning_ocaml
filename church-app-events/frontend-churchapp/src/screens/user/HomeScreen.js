import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
} from 'react-native';
import {Card, Title, Paragraph} from 'react-native-paper';
import HeaderUser from '../../components/HeaderUser';
import EventsScreen from './EventsScreen';
import MediaScreen from './MediaScreen';
import HomeGroupScreen from './HomeGroupScreen';
import ServingScreen from './ServingScreen';
import GivingScreen from './GivingScreen';
import UsersScreen from './UsersScreen';

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      {/* Reusable Header Banner */}
      <HeaderUser />

      {/* Scrollable content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.cardContainer}>

          {/* Media Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('MediaScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/media.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Manage Media</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view upcoming medias for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* Event Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('EventsScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/event.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Manage Events</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view upcoming events for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* HomeGroup Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('HomeGroupScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/homegroup.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Manage Home Groups</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view upcoming home groups for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* Serving Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('ServingScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/serving.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Serving</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view upcoming servings for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* Giving Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('GivingScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/giving.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Manage Giving</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view upcoming giving for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

          {/* User Card with Image Background */}
          <Card
            style={styles.card}
            onPress={() => navigation.navigate ('UsersScreen')}
          >
            <ImageBackground
              source={require ('../../../assets/pics/user.jpg')}
              style={styles.cardImage}
            >
              <Card.Content style={styles.cardContent}>
                <Title style={styles.cardTitle}>Manage Users</Title>
                <Paragraph style={styles.cardParagraph}>
                  Manage and view users for the church
                </Paragraph>
              </Card.Content>
            </ImageBackground>
          </Card>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1, // Ensures ScrollView takes up full height
  },
  cardContainer: {
    marginTop: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden', // To ensure the image doesn't overflow the card
  },
  cardImage: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end', // Align the text to the bottom
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardParagraph: {
    fontSize: 14,
    color: '#fff',
  },
});

export default HomeScreen;
