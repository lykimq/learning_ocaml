import React, { useEffect, useState } from "react";
import { View, FlatList, ScrollView, StyleSheet, Platform } from "react-native";
import {
    Card,
    Title,
    Button,
    Searchbar,
    Text,
    IconButton,
    Chip,
    Portal,
    Dialog,
    ActivityIndicator
} from "react-native-paper";
import {
    getAllRsvps,
    deleteRsvp,
    confirmRsvpWithEmail,
    declineRsvpWithEmail,
    searchRsvps
} from "../../../services/events/eventRsvpService";
import { showAlert } from '../../constants/constants';

const ITEMS_PER_PAGE = 10;

const EventRsvpList = () => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogCallback, setDialogCallback] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [searchType, setSearchType] = useState('general');
    const [eventTitleSearch, setEventTitleSearch] = useState('');

    const [rsvpData, setRsvpData] = useState({
        rsvps: [],
        total: 0,
        status_counts: {}
    });

    useEffect(() => {
        fetchRsvps();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };


    const fetchRsvps = async () => {
        setLoading(true);
        try {
            const rsvpList = await getAllRsvps();
            console.log('Total RSVPs:', rsvpList.length);

            setRsvpData({
                rsvps: rsvpList || [],
                total: rsvpList.total || 0,
                status_counts: rsvpList.status_counts || {}
            });

        } catch (error) {
            console.error('Error fetching RSVPs:', error);
            handleAlert('Error', 'Failed to fetch RSVPs');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRsvp = async (rsvpId) => {
        try {
            await deleteRsvp(rsvpId);
            fetchRsvps();
            handleAlert('Success', 'RSVP deleted successfully');
        } catch (error) {
            console.error('Error deleting RSVP:', error);
            handleAlert('Error', 'Failed to delete RSVP');
        }
    }

    const handleConfirmRsvp = async (rsvp) => {
        try {
            await confirmRsvpWithEmail(rsvp.id, rsvp.email, rsvp.event_id);
            fetchRsvps();
            handleAlert('Success', 'RSVP confirmed and email sent');
        } catch (error) {
            console.error('Error confirming RSVP:', error);
            handleAlert('Error', 'Failed to confirm RSVP');
        }
    };

    const handleDeclineRsvp = async (rsvp) => {
        try {
            await declineRsvpWithEmail(rsvp.id, rsvp.email, rsvp.event_id);
            fetchRsvps();
            handleAlert('Success', 'RSVP declined and email sent');
        } catch (error) {
            console.error('Error declining RSVP:', error);
            handleAlert('Error', 'Failed to decline RSVP');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            // Build search criteria object
            const searchCriteria = {};

            // Add email criteria if there's a search query
            if (searchQuery) {
                if (searchType === 'email' || (searchType === 'general' && searchQuery.includes('@'))) {
                    searchCriteria.email = searchQuery;
                }
            }

            // Add event title criteria
            if (searchType === 'event' && eventTitleSearch) {
                searchCriteria.event_title = eventTitleSearch;
            } else if (searchType === 'general' && searchQuery && !searchQuery.includes('@')) {
                searchCriteria.event_title = searchQuery;
            }

            // Add status if selected (can be combined with any search)
            if (selectedStatus) {
                searchCriteria.status = selectedStatus;
            }

            // If no search criteria, fetch all RSVPs
            if (Object.keys(searchCriteria).length === 0) {
                const response = await getAllRsvps();
                setRsvpData({
                    rsvps: response || [],
                    total: response.length || 0,
                    status_counts: {
                        confirmed: response.filter(r => r.rsvp_status === 'confirmed').length,
                        pending: response.filter(r => r.rsvp_status === 'pending').length,
                        declined: response.filter(r => r.rsvp_status === 'declined').length
                    }
                });
                return;
            }

            console.log('Searching with criteria:', searchCriteria); // Debug log

            // Perform the search with combined criteria
            const searchResults = await searchRsvps(searchCriteria);

            // Ensure proper data structure
            const results = Array.isArray(searchResults) ? searchResults :
                searchResults?.rsvps ? searchResults.rsvps : [];

            console.log('Search results:', results); // Debug log

            setRsvpData({
                rsvps: results,
                total: results.length,
                status_counts: {
                    confirmed: results.filter(r => r.rsvp_status === 'confirmed').length,
                    pending: results.filter(r => r.rsvp_status === 'pending').length,
                    declined: results.filter(r => r.rsvp_status === 'declined').length
                }
            });

            setCurrentPage(1);
        } catch (error) {
            console.error('Error searching RSVPs:', error);
            handleAlert('Error', 'Failed to search RSVPs');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return '#4CAF50';  // Darker green
            case 'pending':
                return '#FF9800';  // Darker orange
            case 'declined':
                return '#F44336';  // Darker red
            default:
                return '#757575';  // Default gray
        }
    };
    const renderItem = ({ item }) => (
        <Card style={styles.rsvpCard}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.rsvpContainer}>
                    <View style={styles.eventInfoSection}>
                        <Title style={styles.eventTitle}>{item.event_title}</Title>
                        <View style={styles.infoRow}>
                            <IconButton
                                icon="email-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>{item.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <IconButton
                                icon="calendar-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>
                                {new Date(item.event_date).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusSection}>
                        <Chip
                            style={[
                                styles.statusChip,
                                { backgroundColor: getStatusColor(item.rsvp_status) }
                            ]}
                            textStyle={styles.statusText}
                        >
                            {item.rsvp_status.charAt(0).toUpperCase() + item.rsvp_status.slice(1)}
                        </Chip>
                    </View>
                </View>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <Button
                    mode="outlined"
                    onPress={() => handleConfirmRsvp(item)}
                    disabled={item.rsvp_status === 'confirmed'}
                    style={[styles.actionButton, !item.rsvp_status === 'confirmed' && styles.confirmButton]}
                    labelStyle={styles.actionButtonLabel}
                    icon="check-circle"
                >
                    Confirm
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDeclineRsvp(item)}
                    disabled={item.rsvp_status === 'declined'}
                    style={[styles.actionButton, !item.rsvp_status === 'declined' && styles.declineButton]}
                    labelStyle={[styles.actionButtonLabel, styles.declineButtonLabel]}
                    icon="close-circle"
                >
                    Decline
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDeleteRsvp(item.id)}
                    style={[styles.actionButton, styles.deleteButton]}
                    labelStyle={[styles.actionButtonLabel, styles.deleteButtonLabel]}
                    icon="delete"
                >
                    Delete
                </Button>
            </Card.Actions>
        </Card>
    );

    // Add these new render functions
    const renderSearchTypeAndStatusSelector = () => (
        <View style={styles.searchTypeAndStatusContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chip
                    selected={searchType === 'general'}
                    onPress={() => setSearchType('general')}
                    style={[
                        styles.chipStyle,
                        searchType === 'general' && styles.chipSelected
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        searchType === 'general' && styles.chipTextSelected
                    ]}
                >
                    General
                </Chip>
                <Chip
                    selected={searchType === 'email'}
                    onPress={() => setSearchType('email')}
                    style={[
                        styles.chipStyle,
                        searchType === 'email' && styles.chipSelected
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        searchType === 'email' && styles.chipTextSelected
                    ]}
                >
                    Email
                </Chip>
                <Chip
                    selected={searchType === 'event'}
                    onPress={() => setSearchType('event')}
                    style={[
                        styles.chipStyle,
                        searchType === 'event' && styles.chipSelected
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        searchType === 'event' && styles.chipTextSelected
                    ]}
                >
                    Event Title
                </Chip>
                <Chip
                    selected={selectedStatus === 'pending'}
                    onPress={() => handleStatusFilter('pending')}
                    style={[
                        styles.chipStyle,
                        selectedStatus === 'pending' && { backgroundColor: getStatusColor('pending') }
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        selectedStatus === 'pending' && { color: 'white' }
                    ]}
                >
                    Pending
                </Chip>
                <Chip
                    selected={selectedStatus === 'confirmed'}
                    onPress={() => handleStatusFilter('confirmed')}
                    style={[
                        styles.chipStyle,
                        selectedStatus === 'confirmed' && { backgroundColor: getStatusColor('confirmed') }
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        selectedStatus === 'confirmed' && { color: 'white' }
                    ]}
                >
                    Confirmed
                </Chip>
                <Chip
                    selected={selectedStatus === 'declined'}
                    onPress={() => handleStatusFilter('declined')}
                    style={[
                        styles.chipStyle,
                        selectedStatus === 'declined' && { backgroundColor: getStatusColor('declined') }
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        selectedStatus === 'declined' && { color: 'white' }
                    ]}
                >
                    Declined
                </Chip>
            </ScrollView>
        </View>
    );

    const renderSearchInput = () => {
        return (
            <View style={styles.searchInputContainer}>
                {searchType === 'event' ? (
                    <Searchbar
                        placeholder="Search by event title"
                        value={eventTitleSearch}
                        onChangeText={setEventTitleSearch}
                        style={styles.searchBar}
                    />
                ) : (
                    <Searchbar
                        placeholder={searchType === 'email' ? "Search by email" : "Search RSVPs"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchBar}
                    />
                )}

                {/* Active Filters Display */}
                {(searchQuery || eventTitleSearch) && (
                    <View style={styles.activeFiltersContainer}>
                        {searchQuery && (
                            <Chip
                                onClose={() => setSearchQuery('')}
                                style={styles.filterChip}
                            >
                                {searchType === 'email' ? 'Email: ' :
                                    searchType === 'general' && searchQuery.includes('@') ? 'Email: ' :
                                        'Event: '}{searchQuery}
                            </Chip>
                        )}
                        {eventTitleSearch && searchType === 'event' && (
                            <Chip
                                onClose={() => setEventTitleSearch('')}
                                style={styles.filterChip}
                            >
                                {eventTitleSearch}
                            </Chip>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const handleStatusFilter = async (status) => {
        if (selectedStatus === status) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(status);
        }

        // Trigger search with updated status
        // Small delay to ensure state is updated
        setTimeout(() => {
            handleSearch();
        }, 0);
    };

    // Add a helper function to check if there are active filters
    const hasActiveFilters = () => {
        return searchQuery || eventTitleSearch;
    };

    // Update handleReset to properly clear all filters
    const handleReset = () => {
        setSearchQuery('');
        setEventTitleSearch('');
        setSelectedStatus(null);
        setSearchType('general');
        setCurrentPage(1);
        fetchRsvps();
    };

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const paginatedRsvps = rsvpData?.rsvps?.slice(startIndex, endIndex) || [];

    console.log('rsvpData:', rsvpData);
    console.log('startIndex:', startIndex);
    console.log('endIndex:', endIndex);
    console.log('paginatedRsvps:', paginatedRsvps);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                {renderSearchTypeAndStatusSelector()}
                {renderSearchInput()}

                <View style={styles.filterRow}>
                    <Button
                        mode="contained"
                        onPress={handleSearch}
                        style={styles.filterButton}
                        icon="magnify"
                    >
                        Search
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={handleReset}
                        style={styles.filterButton}
                        icon="refresh"
                    >
                        Reset
                    </Button>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <>
                    <View style={styles.statsContainer}>
                        <Text style={styles.statusText}>Total RSVPs: {rsvpData.total}</Text>
                        <Text style={styles.statusText}>Confirmed: {rsvpData.status_counts.confirmed || 0}</Text>
                        <Text style={styles.statusText}>Pending: {rsvpData.status_counts.pending || 0}</Text>
                        <Text style={styles.statusText}>Declined: {rsvpData.status_counts.declined || 0}</Text>
                    </View>

                    {rsvpData.rsvps.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No RSVPs found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={paginatedRsvps}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}
                </>
            )}

            {rsvpData.total > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Previous"
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(rsvpData.total / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={endIndex >= rsvpData.total}
                        title="Next"
                    >
                        Next
                    </Button>
                </View>
            )}

            {/* Add Dialog for web platform */}
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => {
                        setDialogVisible(false);
                        if (dialogCallback) {
                            dialogCallback();
                            setDialogCallback(null);
                        }
                    }}
                    style={styles.dialogContainer}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.cardText}>{dialogMessage.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setDialogVisible(false);
                                if (dialogCallback) {
                                    dialogCallback();
                                    setDialogCallback(null);
                                }
                            }}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                        >
                            OK
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchBar: {
        elevation: 0,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    rsvpCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: Platform.OS === 'ios' ? 1 : 0,
        borderColor: '#e0e0e0',
    },
    cardContent: {
        padding: 16,
    },
    rsvpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    eventInfoSection: {
        flex: 1,
        marginRight: 16,
    },
    statusSection: {
        alignItems: 'flex-end',
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoIcon: {
        margin: 0,
        marginRight: 4,
    },
    infoText: {
        color: '#333',
        fontSize: 14,
        flex: 1,
    },
    statusChip: {
        paddingHorizontal: 12,
        height: 28,
        backgroundColor: '#f0f0f0',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    cardActions: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        marginHorizontal: 4,
        borderRadius: 8,
    },
    actionButtonLabel: {
        fontSize: 13,
        color: '#555',
    },
    confirmButton: {
        borderColor: '#4CAF50',
    },
    confirmButtonLabel: {
        color: '#4CAF50',
    },
    declineButton: {
        borderColor: '#F44336',
    },
    declineButtonLabel: {
        color: '#F44336',
    },
    deleteButton: {
        borderColor: '#757575',
    },
    deleteButtonLabel: {
        color: '#757575',
    },
    searchTypeAndStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 8,
    },
    chipStyle: {
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    chipTextStyle: {
        color: '#333',
        fontSize: 12,
        fontWeight: '500',
    },
    chipSelected: {
        backgroundColor: '#757575',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
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
        borderColor: '#757575',
        backgroundColor: '#f5f5f5',
    },
    filterButtonLabel: {
        color: '#333',
    },
    filtersContainer: {
        marginTop: 10,
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
    },
    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    filterChip: {
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        marginBottom: 4,
    },
    filterChipText: {
        color: '#333',
    },
    statsContainer: {
        padding: 16,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginHorizontal: 8,
        marginVertical: 4,
    },
    statusTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    pageText: {
        marginHorizontal: 16,
        color: '#333',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialogContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        maxWidth: 400,
        width: '90%',
        alignSelf: 'center',
    },
    statusButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        gap: 8,
    },
    statusButton: {
        borderRadius: 20,
        marginHorizontal: 4,
    },
    statusButtonLabel: {
        fontSize: 12,
        color: '#555',
    },
});


export default EventRsvpList;