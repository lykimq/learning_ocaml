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
import EventForm from "./EventForm";
import DateTimePicker from '@react-native-community/datetimepicker';
import { showAlert, onDateChange as handleDateChange, onTimeChange as handleTimeChange } from
    "../../constants/constants";

const ITEMS_PER_PAGE = 10;

const DatePickerField = ({ label, value, onChange }) => {
    const [show, setShow] = useState(false);

    const handleChange = (event, selectedDate) => {
        handleDateChange(
            event,
            selectedDate,
            value,
            setShow,
            onChange
        );
    };

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
                                handleChange({ type: 'set', nativeEvent: { timestamp: date } }, date);
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
                    onChange={handleChange}
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
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const eventsList = await getEvents();
            console.log('Total events in database:', eventsList.length);
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events:', error);
            handleAlert('Error', 'Failed to fetch events');
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
            handleAlert('Success', 'Event deleted successfully');
        } catch (error) {
            console.error('Error deleting event:', error);
            handleAlert('Error', 'Failed to delete event');
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
            handleAlert('Error', 'Failed to search events');
        } finally {
            setLoading(false);
        }
    };


    const handleReset = () => {
        setSearchQuery('');
        setStartDate(null);
        setEndDate(null);
        fetchEvents();
    };

    const handleStartDateChange = (event, selectedDate) => {
        handleDateChange(
            event,
            selectedDate,
            startDate,
            setShowStartDate,
            setStartDate
        );
    };

    const handleEndDateChange = (event, selectedDate) => {
        handleDateChange(
            event,
            selectedDate,
            endDate,
            setShowEndDate,
            setEndDate
        );
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
            <Card.Content style={styles.cardContent}>
                <View style={styles.dateContainer}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateMonth}>
                            {new Date(item.event_date).toLocaleString('default', { month: 'short' })}
                        </Text>
                        <Text style={styles.dateDay}>
                            {new Date(item.event_date).getDate()}
                        </Text>
                    </View>
                    <View style={styles.eventDetails}>
                        <Title style={styles.eventTitle}>{item.event_title}</Title>
                        <View style={styles.eventInfo}>
                            <IconButton
                                icon="clock-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>{item.event_time.toString()}</Text>
                        </View>
                        <View style={styles.eventInfo}>
                            <IconButton
                                icon="map-marker-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>{item.address}</Text>
                        </View>
                    </View>
                </View>
                {item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                )}
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <Button
                    mode="outlined"
                    onPress={() => handleEditEvent(item)}
                    style={styles.actionButton}
                    labelStyle={styles.actionButtonLabel}
                    icon="pencil"
                >
                    Edit
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDeleteEvent(item.id)}
                    style={[styles.actionButton, styles.deleteButton]}
                    labelStyle={styles.deleteButtonLabel}
                    icon="delete"
                >
                    Delete
                </Button>
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
                            onChange={(date) => handleStartDateChange(null, date)}
                        />
                        <DatePickerField
                            label="Select End Date"
                            value={endDate}
                            onChange={(date) => handleEndDateChange(null, date)}
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

const COLORS = {
    white: '#fff', // white
    background: '#f5f5f5', // light gray
    border: '#e0e0e0', // gray
    shadow: '#000', // black
    blue: '#3f51b5', // blue
    text: '#333', // dark text
    error: '#c62828', // red
    errorBorder: '#F44336', // red
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: LAYOUT.padding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.title.fontSize,
        marginLeft: 10,
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
    searchButton: {
        marginTop: 16,
        borderRadius: 8,
        backgroundColor: COLORS.blue,
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
        padding: 8,
        alignItems: 'center',
        minWidth: 60,
    },
    dateMonth: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateDay: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
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
        borderColor: COLORS.blue,
    },
    actionButtonLabel: {
        color: COLORS.blue,
        fontSize: TYPOGRAPHY.button.fontSize,
    },
    deleteButton: {
        borderColor: COLORS.errorBorder,
    },
    deleteButtonLabel: {
        color: COLORS.error,
        fontSize: TYPOGRAPHY.button.fontSize,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 8,
        borderColor: COLORS.blue,
    },
    filtersContainer: {
        marginTop: 10,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.background,
        borderRadius: 12,
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

export default EventsList;