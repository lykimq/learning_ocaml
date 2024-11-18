import {View, Text, StyleSheet} from 'react-native';

const EventCard = ({event}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.date}>{event.date}</Text>
      <Text style={styles.description}>{event.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create ({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#444',
  },
});

export default EventCard;
