import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Platform } from "react-native";
import {
  Card,
  Title,
  Button,
  Searchbar,
  Text,
  IconButton,
  Avatar,
} from "react-native-paper";
import { getHomeGroups, searchHomeGroups } from "../../../services/homegroups/homeGroupService";
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import HomeGroupRSVP from "./HomeGroupRSVP";

const ITEMS_PER_PAGE = 10;

const HomeGroupScreen = () => {
  const navigation = useNavigation();
  const [homeGroups, setHomeGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const route = useRoute();
  const [selectedHomeGroup, setSelectedHomeGroup] = useState(null);

  useEffect(() => {
    fetchHomeGroups();
  }, [route.params?.reset]);

  const fetchHomeGroups = async () => {
    setLoading(true);
    try {
      const groups = await getHomeGroups();
      setHomeGroups(groups);
    } catch (error) {
      console.error('Error fetching home groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchHomeGroups({ name: searchQuery });
      setHomeGroups(results);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    fetchHomeGroups();
  };

  const handleJoin = (homeGroup) => {
    setSelectedHomeGroup(homeGroup);
  };

  const handleCloseRSVP = () => {
    setSelectedHomeGroup(null);
  };

  const filteredHomeGroups = homeGroups
    .filter((group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const paginatedHomeGroups = filteredHomeGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderItem = ({ item }) => {
    const groupInitials = item.name
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
              style={styles.dateBox}
            />
            <View style={styles.eventDetails}>
              <Title style={styles.eventTitle}>{item.name}</Title>
              <View style={styles.eventInfo}>
                <IconButton
                  icon="map-marker-outline"
                  size={16}
                  color="#666"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
              <View style={styles.eventInfo}>
                <IconButton
                  icon="calendar"
                  size={16}
                  color="#666"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {`${format(new Date(item.meeting_day), 'MMM dd, yyyy')} at ${item.meeting_time}`}
                </Text>
              </View>
            </View>
          </View>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
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

  if (selectedHomeGroup) {
    return <HomeGroupRSVP homeGroup={selectedHomeGroup} onClose={handleCloseRSVP} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search home groups"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
        <View style={styles.filterRow}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={styles.filterButton}
          >
            Reset
          </Button>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading home groups...</Text>
      ) : (
        <FlatList
          data={paginatedHomeGroups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {filteredHomeGroups.length > ITEMS_PER_PAGE && (
        <View style={styles.paginationContainer}>
          <Button
            mode="text"
            onPress={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Text style={styles.pageText}>
            Page {currentPage} of {Math.ceil(filteredHomeGroups.length / ITEMS_PER_PAGE)}
          </Text>
          <Button
            mode="text"
            onPress={() => setCurrentPage(p => p + 1)}
            disabled={currentPage * ITEMS_PER_PAGE >= filteredHomeGroups.length}
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateBox: {
    backgroundColor: COLORS.blue,
    borderRadius: 8,
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
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    margin: 0,
    marginRight: 4,
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
});

export default HomeGroupScreen;
