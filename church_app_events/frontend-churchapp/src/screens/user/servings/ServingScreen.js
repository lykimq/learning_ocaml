import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import {
  Card,
  Title,
  Button,
  Searchbar,
  Text,
  Avatar,
  IconButton,
} from "react-native-paper";
import { getAllServing, searchServings } from "../../../services/servings/servingService";
import ServingRSVP from "./ServingRSVP";

const ITEMS_PER_PAGE = 10;

const ServingScreen = () => {
  const [servings, setServings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServing, setSelectedServing] = useState(null);

  useEffect(() => {
    fetchServings();
  }, []);

  const fetchServings = async () => {
    setLoading(true);
    try {
      const results = await getAllServing();
      setServings(results);
    } catch (error) {
      console.error('Error fetching servings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchServings({ title: searchQuery });
      setServings(results);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServings = servings
    .filter((serving) =>
      serving && serving.title && serving.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const paginatedServings = filteredServings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleJoin = (serving) => {
    setSelectedServing(serving);
  };

  const handleCloseRSVP = () => {
    setSelectedServing(null);
  };

  const renderItem = ({ item }) => {
    const groupInitials = item.title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <Card style={styles.eventCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.dateContainer}>
            <Avatar.Text
              size={60}
              label={groupInitials}
              style={[styles.dateBox, { backgroundColor: COLORS.blue }]}
            />
            <View style={styles.eventDetails}>
              <Title style={styles.eventTitle}>{item.title}</Title>
              <View style={styles.eventInfo}>
                <IconButton
                  icon="map-marker-outline"
                  size={16}
                  color="#666"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => handleJoin(item)}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            Register
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (selectedServing) {
    return <ServingRSVP serving={selectedServing} onClose={handleCloseRSVP} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search servings"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading servings...</Text>
      ) : (
        <FlatList
          data={paginatedServings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {filteredServings.length > ITEMS_PER_PAGE && (
        <View style={styles.paginationContainer}>
          <Button
            mode="text"
            onPress={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Text style={styles.pageText}>
            Page {currentPage} of {Math.ceil(filteredServings.length / ITEMS_PER_PAGE)}
          </Text>
          <Button
            mode="text"
            onPress={() => setCurrentPage(p => p + 1)}
            disabled={currentPage * ITEMS_PER_PAGE >= filteredServings.length}
          >
            Next
          </Button>
        </View>
      )}
    </View>
  );
};


const COLORS = {
  white: '#fff',
  background: '#f5f5f5',
  border: '#e0e0e0',
  shadow: '#000',
  blue: '#3f51b5',
  text: '#333',
  error: '#c62828',
  errorBorder: '#F44336',
};

const LAYOUT = {
  padding: 16,
  borderRadius: 8,
  maxWidth: 600,
};

const TYPOGRAPHY = {
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
  },
  button: {
    fontSize: 16,
  },
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: LAYOUT.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  filterButton: {
    borderRadius: 8,
    borderColor: COLORS.blue,
  },
  listContainer: {
    padding: LAYOUT.padding,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: COLORS.border,
  },
  cardContent: {
    padding: LAYOUT.padding,
  },
  eventDetails: {
    flex: 1,
    marginLeft: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.label.fontSize,
    flex: 1,
  },
  description: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.label.fontSize,
    lineHeight: 20,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  actionButton: {
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
  },
  actionButtonLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.button.fontSize,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageText: {
    marginHorizontal: 16,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.label.fontSize,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: TYPOGRAPHY.label.fontSize,
    color: COLORS.text,
  },
  dateBox: {
    marginTop: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
});

export default ServingScreen;
