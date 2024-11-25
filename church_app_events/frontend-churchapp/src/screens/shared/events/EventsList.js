import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet, Platform } from "react-native";
import {
    Card,
    Title,
    Paragraph,
    Button,
    Searchbar,
    Text,
    IconButton
} from "react-native-paper";
import { getEvents, deleteEvent } from "../../../services/eventService";
import EventForm from "../../admin/events/EventForm";

const ITEMS_PER_PAGE = 10;

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const eventsList = await getEvents();
            console.log('Total events in database:', eventsList.length);
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events:', error);
            Alert.alert('Error', 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
    };

    const handleDeleteEvent = async (id) => {
        try {
            await deleteEvent(id);
            fetchEvents();
            Alert.alert('Success', 'Event deleted successfully');
        } catch (error) {
            console.error('Error deleting event:', error);
            Alert.alert('Error', 'Failed to delete event');
        }
    };

    const handleFormSubmit = () => {
        setEditingEvent(null);
        fetchEvents();
    };

    const filteredEvents = events.filter((event) =>
        event.event_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const renderItem = ({ item }) => (
        <Card style={styles.eventCard}>
            <Card.Content>
                <Title>{item.event_title}</Title>
                <Paragraph>Date: {new Date(item.event_date).toLocaleDateString()}</Paragraph>
                <Paragraph>Time: {item.event_time.toString()}</Paragraph>
                <Paragraph>Address: {item.address}</Paragraph>
                <Paragraph>Description: {item.description}</Paragraph>
            </Card.Content>
            <Card.Actions>
                <IconButton
                    icon="pencil"
                    color="#2196F3"
                    onPress={() => handleEditEvent(item)}
                    style={styles.iconButton}
                    size={20}
                />
                <IconButton
                    icon="delete"
                    color="#F44336"
                    onPress={() => handleDeleteEvent(item.id)}
                    style={styles.iconButton}
                    size={20}
                />
            </Card.Actions>
        </Card>
    );

    if (editingEvent) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={() => setEditingEvent(null)}
                    />
                    <Title style={styles.headerTitle}>Edit Event</Title>
                </View>
                <EventForm
                    eventData={editingEvent}
                    onSubmit={handleFormSubmit}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search events"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            {loading ? (
                <Text style={styles.loadingText}>Loading events...</Text>
            ) : (
                <FlatList
                    data={paginatedEvents}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {filteredEvents.length > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= filteredEvents.length}
                    >
                        Next
                    </Button>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        marginLeft: 10,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchBar: {
        elevation: 0,
    },
    listContainer: {
        padding: 16,
    },
    eventCard: {
        marginBottom: 16,
    },
    iconButton: {
        margin: 0,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    pageText: {
        marginHorizontal: 16,
        color: '#666',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});

export default EventsList;