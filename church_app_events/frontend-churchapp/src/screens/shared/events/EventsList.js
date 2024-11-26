import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, StyleSheet, Platform } from "react-native";
import {
    Card,
    Title,
    Paragraph,
    Button,
    Searchbar,
    Text,
    IconButton,
    TextInput
} from "react-native-paper";
import { getEvents, deleteEvent, searchEvents } from "../../../services/events/eventService";
import EventForm from "../../admin/events/EventForm";
import DateTimePicker from '@react-native-community/datetimepicker';

const ITEMS_PER_PAGE = 10;

const DatePickerField = ({ label, value, onChange }) => {
    const [show, setShow] = useState(false);

    if (Platform.OS === 'web') {
        return (
            <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>{label}</Text>
                <TextInput
                    value={value ? value.toISOString().split('T')[0] : ''}
                    mode="outlined"
                    render={({ style, ...props }) => (
                        <input
                            {...props}
                            type="date"
                            style={{
                                height: 40,
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 4,
                                border: '1px solid #ccc'
                            }}
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                onChange(date);
                            }}
                        />
                    )}
                />
            </View>
        );
    }

    return (
        <View style={styles.dateContainer}>
            <Button onPress={() => setShow(true)}>
                {value ? value.toLocaleDateString() : label}
            </Button>
            {show && (
                <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    onChange={(event, selectedDate) => {
                        setShow(false);
                        if (selectedDate) {
                            onChange(selectedDate);
                        }
                    }}
                />
            )}
        </View>
    );
};

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingEvent, setEditingEvent] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);

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

    const handleSearch = async () => {
        setLoading(true);
        try {
            const searchParams = {
                text: searchQuery,
                start_date: startDate ? startDate.toISOString().split('T')[0] : null,
                end_date: endDate ? endDate.toISOString().split('T')[0] : null,
            };

            const results = await searchEvents(searchParams);
            setEvents(results);
            setCurrentPage(1); // Reset to first page
        } catch (error) {
            console.error('Search failed:', error);
            Alert.alert('Error', 'Failed to search events');
        } finally {
            setLoading(false);
        }
    };

    const onStartDateChange = (event, selectedDate) => {
        setShowStartDate(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndDate(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        setStartDate(null);
        setEndDate(null);
        fetchEvents();
    };

    const filteredEvents = events
        .filter((event) =>
            event.event_title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(`${a.event_date} ${a.event_time}`);
            const dateB = new Date(`${b.event_date} ${b.event_time}`);
            return dateB - dateA; // Sort in descending order (oldest first)
        });

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
                    onSubmitEditing={handleSearch}
                    style={styles.searchBar}
                />
                <View style={styles.filterRow}>
                    <Button
                        mode="outlined"
                        onPress={() => setShowFilters(!showFilters)}
                        style={styles.filterButton}
                    >
                        Filters
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={handleReset}
                        style={styles.filterButton}
                    >
                        Reset
                    </Button>
                </View>

                {showFilters && (
                    <View style={styles.filtersContainer}>
                        <DatePickerField
                            label="Select Start Date"
                            value={startDate}
                            onChange={setStartDate}
                        />
                        <DatePickerField
                            label="Select End Date"
                            value={endDate}
                            onChange={setEndDate}
                        />
                        <Button
                            mode="contained"
                            onPress={handleSearch}
                            style={styles.searchButton}
                        >
                            Search
                        </Button>
                    </View>
                )}
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
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    filtersContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
    },
    dateContainer: {
        marginVertical: 10,
        width: '100%',
    },
    dateLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: '#000000',
    },
    searchButton: {
        marginTop: 10,
    },
});

export default EventsList;