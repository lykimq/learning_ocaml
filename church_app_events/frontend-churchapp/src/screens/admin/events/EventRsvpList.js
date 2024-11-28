import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, ScrollView, StyleSheet, Platform } from "react-native";
import {
    Card,
    Title,
    Paragraph,
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
    searchRsvpsByStatus,
    searchRsvps,
    searchRsvpsByEventTitle,
    searchRsvpsWithEmail
} from "../../../services/events/eventRsvpService";

const ITEMS_PER_PAGE = 10;

const EventRsvpList = () => {
    const [data, setData] = useState({ summary: { total: 0, status_counts: {} }, rsvps: [] });
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

    // Cross-platform alert function
    const showAlert = (title, message, onOk) => {
        if (Platform.OS === 'web') {
            setDialogMessage({ title, message });
            setDialogVisible(true);
            // Store callback for web dialog
            if (onOk) {
                setDialogCallback(() => onOk);
            }
        } else {
            Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
        }
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
            showAlert('Error', 'Failed to fetch RSVPs');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRsvp = async (rsvpId) => {
        try {
            await deleteRsvp(rsvpId);
            fetchRsvps();
            showAlert('Success', 'RSVP deleted successfully');
        } catch (error) {
            console.error('Error deleting RSVP:', error);
            showAlert('Error', 'Failed to delete RSVP');
        }
    }

    const handleConfirmRsvp = async (rsvp) => {
        try {
            await confirmRsvpWithEmail(rsvp.id, rsvp.email, rsvp.event_id);
            fetchRsvps();
            showAlert('Success', 'RSVP confirmed and email sent');
        } catch (error) {
            console.error('Error confirming RSVP:', error);
            showAlert('Error', 'Failed to confirm RSVP');
        }
    };

    const handleDeclineRsvp = async (rsvp) => {
        try {
            await declineRsvpWithEmail(rsvp.id, rsvp.email, rsvp.event_id);
            fetchRsvps();
            showAlert('Success', 'RSVP declined and email sent');
        } catch (error) {
            console.error('Error declining RSVP:', error);
            showAlert('Error', 'Failed to decline RSVP');
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
            showAlert('Error', 'Failed to search RSVPs');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#4CAF50';
            case 'declined': return '#F44336';
            case 'pending': return '#FFC107';
            default: return '#9E9E9E';
        }
    }
    const renderItem = ({ item }) => (
        <Card style={styles.rsvpCard}>
            <Card.Content>
                <Title>{item.event_title}</Title>
                <Paragraph>Email: {item.email}</Paragraph>
                <Paragraph>Date: {new Date(item.event_date).toLocaleDateString()}</Paragraph>
                <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(item.rsvp_status) }]}
                >
                    {item.rsvp_status}
                </Chip>
            </Card.Content>
            <Card.Actions>
                <Button
                    mode="contained"
                    onPress={() => handleConfirmRsvp(item)}
                    disabled={item.rsvp_status === 'confirmed'}
                    style={styles.actionButton}
                >
                    Confirm
                </Button>
                <Button
                    mode="contained"
                    onPress={() => handleDeclineRsvp(item)}
                    disabled={item.rsvp_status === 'declined'}
                    style={[styles.actionButton, styles.declineButton]}
                >
                    Decline
                </Button>
                <IconButton
                    icon="delete"
                    color="#F44336"
                    onPress={() => handleDeleteRsvp(item.id)}
                />
            </Card.Actions>
        </Card>
    );

    // Add these new render functions
    const renderSearchTypeSelector = () => (
        <View style={styles.searchTypeContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chip
                    selected={searchType === 'general'}
                    onPress={() => setSearchType('general')}
                    style={styles.chipStyle}
                >
                    General
                </Chip>
                <Chip
                    selected={searchType === 'email'}
                    onPress={() => setSearchType('email')}
                    style={styles.chipStyle}
                >
                    Email
                </Chip>
                <Chip
                    selected={searchType === 'event'}
                    onPress={() => setSearchType('event')}
                    style={styles.chipStyle}
                >
                    Event Title
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
                {hasActiveFilters() && (
                    <View style={styles.activeFiltersContainer}>
                        {searchQuery && (searchType === 'email' || searchType === 'general') && (
                            <Chip
                                onClose={() => setSearchQuery('')}
                                style={styles.filterChip}
                            >
                                Email: {searchQuery}
                            </Chip>
                        )}
                        {eventTitleSearch && searchType === 'event' && (
                            <Chip
                                onClose={() => setEventTitleSearch('')}
                                style={styles.filterChip}
                            >
                                Event: {eventTitleSearch}
                            </Chip>
                        )}
                        {selectedStatus && (
                            <Chip
                                onClose={() => setSelectedStatus(null)}
                                style={styles.filterChip}
                            >
                                Status: {selectedStatus}
                            </Chip>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderStatusButtons = () => (
        <View style={styles.statusButtonsContainer}>
            <Button
                mode={selectedStatus === 'pending' ? 'contained' : 'outlined'}
                onPress={() => handleStatusFilter('pending')}
                style={[
                    styles.statusButton,
                    selectedStatus === 'pending' && { backgroundColor: getStatusColor('pending') }
                ]}
                labelStyle={[
                    styles.statusButtonLabel,
                    selectedStatus === 'pending' && { color: 'white' }
                ]}
            >
                Pending
            </Button>

            <Button
                mode={selectedStatus === 'confirmed' ? 'contained' : 'outlined'}
                onPress={() => handleStatusFilter('confirmed')}
                style={[
                    styles.statusButton,
                    selectedStatus === 'confirmed' && { backgroundColor: getStatusColor('confirmed') }
                ]}
                labelStyle={[
                    styles.statusButtonLabel,
                    selectedStatus === 'confirmed' && { color: 'white' }
                ]}
            >
                Confirmed
            </Button>

            <Button
                mode={selectedStatus === 'declined' ? 'contained' : 'outlined'}
                onPress={() => handleStatusFilter('declined')}
                style={[
                    styles.statusButton,
                    selectedStatus === 'declined' && { backgroundColor: getStatusColor('declined') }
                ]}
                labelStyle={[
                    styles.statusButtonLabel,
                    selectedStatus === 'declined' && { color: 'white' }
                ]}
            >
                Declined
            </Button>
        </View>
    );

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
        return searchQuery || eventTitleSearch || selectedStatus;
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
                {renderSearchTypeSelector()}
                {renderSearchInput()}

                {renderStatusButtons()}

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
        elevation: 2,
    },
    searchBar: {
        elevation: 0,
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
    listContainer: {
        padding: 16,
    },
    rsvpCard: {
        marginBottom: 16,
    },
    statusChip: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    actionButton: {
        marginRight: 8,
    },
    declineButton: {
        backgroundColor: '#F44336',
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
    searchTypeContainer: {
        marginBottom: 10,
    },
    chipStyle: {
        marginRight: 8,
        marginBottom: 8,
    },
    statusButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    statusButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 20,
    },
    statusButtonLabel: {
        fontSize: 12,
    },
    statsContainer: {
        padding: 16,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 10,
    },
    dialogContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    searchSection: {
        marginBottom: 15,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    button: {
        marginVertical: 5,
        borderRadius: 8,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    searchInputContainer: {
        marginBottom: 10,
    },
    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    filterChip: {
        marginRight: 8,
        marginBottom: 4,
    },
});


export default EventRsvpList;