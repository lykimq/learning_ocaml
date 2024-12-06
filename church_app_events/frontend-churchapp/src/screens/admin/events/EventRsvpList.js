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
            const response = await getAllRsvps();
            console.log('RSVP response:', response);

            if (!response || !response.rsvps) {
                console.error('Invalid response format:', response);
                setRsvpData({
                    rsvps: [],
                    total: 0,
                    status_counts: {
                        confirmed: 0,
                        pending: 0,
                        declined: 0
                    }
                });
                return;
            }

            setRsvpData({
                rsvps: response.rsvps,
                total: response.total,
                status_counts: response.status_counts || {
                    confirmed: 0,
                    pending: 0,
                    declined: 0
                }
            });

        } catch (error) {
            console.error('Error fetching RSVPs:', error);
            handleAlert('Error', 'Failed to fetch RSVPs');
            setRsvpData({
                rsvps: [],
                total: 0,
                status_counts: {
                    confirmed: 0,
                    pending: 0,
                    declined: 0
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRsvp = async (rsvpId) => {
        // Set up confirmation dialog
        setDialogMessage({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this RSVP?'
        });
        setDialogVisible(true);
        setDialogCallback(() => async () => {
            try {
                await deleteRsvp(rsvpId);
                fetchRsvps();
                handleAlert('Success', 'RSVP deleted successfully');
            } catch (error) {
                console.error('Error deleting RSVP:', error);
                handleAlert('Error', 'Failed to delete RSVP');
            }
        });
    };

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
        if (!rsvp || !rsvp.id) {
            handleAlert('Error', 'Invalid RSVP data');
            return;
        }

        setDialogMessage({
            title: 'Confirm Decline',
            message: `Are you sure you want to decline the RSVP for ${rsvp.email}?`
        });
        setDialogVisible(true);
        setDialogCallback(() => async () => {
            try {
                setLoading(true);

                const result = await declineRsvpWithEmail(rsvp.id, rsvp.email, rsvp.event_id);

                if (result.status === 'partial_success') {
                    handleAlert('Partial Success', result.message);
                } else {
                    handleAlert('Success', 'RSVP declined successfully');
                }

            } catch (error) {
                console.error('Decline RSVP error:', error);

                const errorMessage = error.response?.data?.message || error.message || 'Failed to decline RSVP';
                const errorTitle = error.response?.status === 404 ? 'Not Found' : 'Error';

                handleAlert(errorTitle, errorMessage);
            } finally {
                setLoading(false);
                await fetchRsvps();
            }
        });
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
                    rsvps: response.rsvps || [],
                    total: response.total || 0,
                    status_counts: response.status_counts || {
                        confirmed: 0,
                        pending: 0,
                        declined: 0
                    }
                });
                return;
            }

            console.log('Searching with criteria:', searchCriteria); // Debug log

            // Perform the search with combined criteria
            const searchResults = await searchRsvps(searchCriteria);

            setRsvpData({
                rsvps: searchResults.rsvps || [],
                total: searchResults.total || 0,
                status_counts: searchResults.status_counts || {
                    confirmed: 0,
                    pending: 0,
                    declined: 0
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
    const paginatedRsvps = rsvpData.rsvps.slice(startIndex, endIndex);

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
                        setDialogCallback(null);
                    }}
                    style={styles.dialogContainer}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>{dialogMessage.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        {dialogCallback ? (
                            <>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setDialogVisible(false);
                                        setDialogCallback(null);
                                    }}
                                    style={styles.dialogButton}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        const callback = dialogCallback;
                                        setDialogVisible(false);
                                        setDialogCallback(null);
                                        callback();
                                    }}
                                    style={[styles.dialogButton, { marginLeft: 8 }]}
                                >
                                    Confirm
                                </Button>
                            </>
                        ) : (
                            <Button
                                mode="contained"
                                onPress={() => {
                                    setDialogVisible(false);
                                    setDialogCallback(null);
                                }}
                                style={styles.dialogButton}
                            >
                                OK
                            </Button>
                        )}
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const COLORS = {
    background: '#f5f5f5', // light gray background
    white: '#fff', // white
    border: '#e0e0e0', // light gray border
    text: '#333', // dark gray text
    success: '#4CAF50', // green
    error: '#F44336', // red
    shadow: '#000', // shadow color
    chip: '#e0e0e0', // light gray chip background
    chipText: '#333', // dark gray chip text
    filterButton: '#e0e0e0', // light gray filter button background
    filterButtonText: '#333', // dark gray filter button text
    pageText: '#333', // dark gray page text
    emptyText: '#333', // dark gray empty text
};

const LAYOUT = {
    padding: 16,
    borderRadius: 8,
    maxWidth: 600,
};

const TYPOGRAPHY = {
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
    },
    searchBar: {
        elevation: 0,
        backgroundColor: COLORS.background,
        borderRadius: LAYOUT.borderRadius,
    },
    rsvpCard: {
        marginBottom: 16,
        borderRadius: LAYOUT.borderRadius,
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
        color: COLORS.text,
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
        color: COLORS.text,
        fontSize: TYPOGRAPHY.label.fontSize,
        flex: 1,
    },
    statusChip: {
        paddingHorizontal: 12,
        height: 28,
        backgroundColor: COLORS.background,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    cardActions: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        marginHorizontal: 4,
        borderRadius: 8,
    },
    actionButtonLabel: {
        fontSize: TYPOGRAPHY.button.fontSize,
        color: COLORS.text,
    },
    confirmButton: {
        borderColor: COLORS.success,
    },
    confirmButtonLabel: {
        color: COLORS.success,
    },
    declineButton: {
        borderColor: COLORS.error,
    },
    declineButtonLabel: {
        color: COLORS.error,
    },
    deleteButton: {
        borderColor: COLORS.text,
    },
    deleteButtonLabel: {
        color: COLORS.text,
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
        backgroundColor: COLORS.background,
        borderRadius: 20,
    },
    chipTextStyle: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '500',
    },
    chipSelected: {
        backgroundColor: COLORS.text,
    },
    chipTextSelected: {
        color: COLORS.white,
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
        borderColor: COLORS.text,
        backgroundColor: COLORS.background,
    },
    filterButtonLabel: {
        color: COLORS.text,
    },
    filtersContainer: {
        marginTop: 10,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.background,
        borderRadius: LAYOUT.borderRadius,
    },
    filterChip: {
        backgroundColor: COLORS.background,
        marginRight: 8,
        marginBottom: 4,
    },
    filterChipText: {
        color: COLORS.text,
    },

    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    statsContainer: {
        padding: LAYOUT.padding,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginHorizontal: 8,
        marginVertical: 4,
    },
    statusTextSelected: {
        color: COLORS.white,
        fontWeight: '600',
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
        color: COLORS.text,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    pageText: {
        marginHorizontal: 16,
        color: COLORS.text,
        fontSize: TYPOGRAPHY.label.fontSize,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.label.fontSize,
        color: COLORS.text,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialogContainer: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.borderRadius,
        maxWidth: 400,
        width: '90%',
        alignSelf: 'center',
    },
    dialogText: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
    },
    dialogButton: {
        minWidth: 88,
    },
});


export default EventRsvpList;