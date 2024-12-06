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
    getAllRegistrations,
    deleteRegistration,
    sendConfirmationEmail,
    sendDeclineEmail,
    searchRegistrations,
    updateRegistration,
} from "../../../services/homegroups/homeGroupRsvpService";
import { showAlert } from '../../constants/constants';

const ITEMS_PER_PAGE = 10;

const HomegroupMemberList = () => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogCallback, setDialogCallback] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [searchType, setSearchType] = useState('general');
    const [groupNameSearch, setGroupNameSearch] = useState('');

    const [registrationData, setRegistrationData] = useState({
        registrations: [],
        total: 0,
        status_counts: {}
    });

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const registrationList = await getAllRegistrations();

            // Calculate status counts from the registrations array
            const status_counts = (registrationList || []).reduce((acc, reg) => {
                const status = reg.registration_status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {
                approved: 0,
                pending: 0,
                declined: 0
            });

            setRegistrationData({
                registrations: registrationList || [],
                total: registrationList?.length || 0,
                status_counts: status_counts
            });

        } catch (error) {
            console.error('Error fetching registrations:', error);
            handleAlert('Error', 'Failed to fetch registrations');
            setRegistrationData({
                registrations: [],
                total: 0,
                status_counts: {
                    approved: 0,
                    pending: 0,
                    declined: 0
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRegistration = async (registrationId) => {
        // Show confirmation dialog before deleting
        setDialogMessage({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this registration? This action cannot be undone.'
        });
        setDialogVisible(true);
        setDialogCallback(() => async () => {
            try {
                await deleteRegistration(registrationId);
                fetchRegistrations();
                handleAlert('Success', 'Registration deleted successfully');
            } catch (error) {
                console.error('Error deleting registration:', error);
                handleAlert('Error', 'Failed to delete registration');
            }
        });
    };

    const handleConfirmRegistration = async (registration) => {
        try {
            console.log('Registration data:', registration);

            // First update the registration status to 'approved'
            await updateRegistration(registration.id, 'approved');

            const registrationData = {
                id: registration.id,
                rsvp_id: registration.id,
                email: registration.email,
                home_group_id: registration.home_group_id,
                name: registration.name || registration.email.split('@')[0]
            };

            console.log('Sending confirmation data:', registrationData);

            // Then send the confirmation email
            await sendConfirmationEmail(registrationData);

            // Refresh the registrations list
            await fetchRegistrations();

            handleAlert('Success', 'Registration approved and notification email sent successfully');
        } catch (error) {
            if (error.message.includes('rsvp_id')) {
                console.error('Email sending failed but status was updated:', error);
                handleAlert('Success', 'Registration approved successfully');
            } else {
                console.error('Error confirming registration:', error);
                handleAlert('Error', 'Failed to approve registration. Please try again.');
            }
        }
    };

    const handleDeclineRegistration = async (registration) => {
        try {
            console.log('Declining registration:', registration);

            // First update the registration status to 'declined'
            await updateRegistration(registration.id, 'declined');

            // Prepare email data with explicit rsvp_id field
            const registrationData = {
                id: registration.id,            // Used by the frontend
                rsvp_id: registration.id,       // Required by the backend
                email: registration.email,
                home_group_id: registration.home_group_id,
                name: registration.name || registration.email.split('@')[0]
            };

            console.log('Sending decline email data:', registrationData);

            // Then send the decline email
            await sendDeclineEmail(registrationData);

            // Refresh the registrations list
            await fetchRegistrations();

            handleAlert('Success', 'Registration declined and notification email sent successfully');
        } catch (error) {
            // Don't show the error if it's just the email that failed
            if (error.message.includes('rsvp_id')) {
                console.error('Email sending failed but status was updated:', error);
                handleAlert('Success', 'Registration declined successfully');
            } else {
                console.error('Error declining registration:', error);
                handleAlert('Error', 'Failed to decline registration. Please try again.');
            }
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const searchCriteria = {};

            if (searchQuery) {
                if (searchType === 'email' || (searchType === 'general' && searchQuery.includes('@'))) {
                    searchCriteria.email = searchQuery;
                }
            }

            if (searchType === 'group' && groupNameSearch) {
                searchCriteria.group_name = groupNameSearch;
            } else if (searchType === 'general' && searchQuery && !searchQuery.includes('@')) {
                searchCriteria.group_name = searchQuery;
            }

            if (selectedStatus) {
                searchCriteria.status = selectedStatus;
            }

            if (Object.keys(searchCriteria).length === 0) {
                const registrationList = await getAllRegistrations();
                setRegistrationData({
                    registrations: registrationList || [],
                    total: registrationList?.length || 0,
                    status_counts: registrationList.status_counts || {
                        confirmed: 0,
                        pending: 0,
                        declined: 0
                    }
                });
                return;
            }

            console.log('Searching with criteria:', searchCriteria);

            // Perform the search
            const searchResults = await searchRegistrations(searchCriteria);

            setRegistrationData({
                registrations: searchResults.registrations || [],
                total: searchResults.total || 0,
                status_counts: searchResults.status_counts || {
                    confirmed: 0,
                    pending: 0,
                    declined: 0
                }
            });

            setCurrentPage(1);
        } catch (error) {
            console.error('Error searching registrations:', error);
            handleAlert('Error', 'Failed to search registrations');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusFilter = async (status) => {
        if (selectedStatus === status) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(status);
        }
        // Small delay to ensure state is updated
        setTimeout(() => {
            handleSearch();
        }, 0);
    };

    const handleReset = () => {
        setSearchQuery('');
        setGroupNameSearch('');
        setSelectedStatus(null);
        setSearchType('general');
        setCurrentPage(1);
        fetchRegistrations();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return '#4CAF50';
            case 'pending':
                return '#FF9800';
            case 'declined':
                return '#F44336';
            default:
                return '#757575';
        }
    };

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
                    selected={searchType === 'group'}
                    onPress={() => setSearchType('group')}
                    style={[
                        styles.chipStyle,
                        searchType === 'group' && styles.chipSelected
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        searchType === 'group' && styles.chipTextSelected
                    ]}
                >
                    Group Name
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
                    selected={selectedStatus === 'approved'}
                    onPress={() => handleStatusFilter('approved')}
                    style={[
                        styles.chipStyle,
                        selectedStatus === 'approved' && { backgroundColor: getStatusColor('approved') }
                    ]}
                    textStyle={[
                        styles.chipTextStyle,
                        selectedStatus === 'approved' && { color: 'white' }
                    ]}
                >
                    Approved
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

    const renderSearchInput = () => (
        <View style={styles.searchInputContainer}>
            {searchType === 'group' ? (
                <Searchbar
                    placeholder="Search by group name"
                    value={groupNameSearch}
                    onChangeText={setGroupNameSearch}
                    style={styles.searchBar}
                />
            ) : (
                <Searchbar
                    placeholder={searchType === 'email' ? "Search by email" : "Search registrations"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchBar}
                />
            )}

            {(searchQuery || groupNameSearch) && (
                <View style={styles.activeFiltersContainer}>
                    {searchQuery && (
                        <Chip
                            onClose={() => setSearchQuery('')}
                            style={styles.filterChip}
                        >
                            {searchType === 'email' ? 'Email: ' : 'Search: '}{searchQuery}
                        </Chip>
                    )}
                    {groupNameSearch && searchType === 'group' && (
                        <Chip
                            onClose={() => setGroupNameSearch('')}
                            style={styles.filterChip}
                        >
                            Group: {groupNameSearch}
                        </Chip>
                    )}
                </View>
            )}
        </View>
    );

    const renderItem = ({ item }) => (
        <Card style={styles.registrationCard}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.registrationContainer}>
                    <View style={styles.infoSection}>
                        <Title style={styles.groupTitle}>{item.name}</Title>
                        <View style={styles.infoRow}>
                            <IconButton
                                icon="account-group"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>
                                Group: {item.group_name || item.home_group_id}
                            </Text>
                        </View>
                        {item.group_description && (
                            <View style={styles.infoRow}>
                                <IconButton
                                    icon="information-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.group_description}</Text>
                            </View>
                        )}
                        {(item.meeting_day || item.meeting_time) && (
                            <View style={styles.infoRow}>
                                <IconButton
                                    icon="clock-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>
                                    Meets: {item.meeting_day} {item.meeting_time}
                                </Text>
                            </View>
                        )}
                        {item.location && (
                            <View style={styles.infoRow}>
                                <IconButton
                                    icon="map-marker-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.location}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <IconButton
                                icon="email-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>{item.email}</Text>
                        </View>
                        {item.phone && (
                            <View style={styles.infoRow}>
                                <IconButton
                                    icon="phone-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.phone}</Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <IconButton
                                icon="calendar-outline"
                                size={16}
                                color="#666"
                                style={styles.infoIcon}
                            />
                            <Text style={styles.infoText}>
                                Registered: {new Date(item.registration_date).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusSection}>
                        <Chip
                            style={[
                                styles.statusChip,
                                { backgroundColor: getStatusColor(item.registration_status) }
                            ]}
                            textStyle={styles.statusText}
                        >
                            {item.registration_status.charAt(0).toUpperCase() +
                                item.registration_status.slice(1)}
                        </Chip>
                    </View>
                </View>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <Button
                    mode="outlined"
                    onPress={() => handleConfirmRegistration(item)}
                    disabled={item.registration_status === 'approved'}
                    style={[styles.actionButton,
                    item.registration_status !== 'approved' &&
                    styles.confirmButton]}
                    labelStyle={styles.actionButtonLabel}
                    icon="check-circle"
                >
                    Approve
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDeclineRegistration(item)}
                    disabled={item.registration_status === 'declined'}
                    style={[styles.actionButton,
                    item.registration_status !== 'declined' &&
                    styles.declineButton]}
                    labelStyle={[styles.actionButtonLabel, styles.declineButtonLabel]}
                    icon="close-circle"
                >
                    Decline
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => handleDeleteRegistration(item.id)}
                    style={[styles.actionButton, styles.deleteButton]}
                    labelStyle={[styles.actionButtonLabel, styles.deleteButtonLabel]}
                    icon="delete"
                >
                    Delete
                </Button>
            </Card.Actions>
        </Card>
    );

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const paginatedRegistrations = registrationData.registrations.slice(startIndex, endIndex);

    console.log('paginatedRegistrations:', paginatedRegistrations);
    console.log('startIndex:', startIndex);
    console.log('endIndex:', endIndex);
    console.log('registrationData.registrations:', registrationData.registrations);

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
                        <Text style={styles.statusText}>
                            Total Registrations: {registrationData.total}
                        </Text>
                        <Text style={styles.statusText}>
                            Approved: {registrationData.status_counts.approved || 0}
                        </Text>
                        <Text style={styles.statusText}>
                            Pending: {registrationData.status_counts.pending || 0}
                        </Text>
                        <Text style={styles.statusText}>
                            Declined: {registrationData.status_counts.declined || 0}
                        </Text>
                    </View>

                    {registrationData.registrations.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No registrations found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={paginatedRegistrations}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContainer}
                        />
                    )}
                </>
            )}

            {registrationData.total > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(registrationData.total / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={endIndex >= registrationData.total}
                    >
                        Next
                    </Button>
                </View>
            )}


            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => {
                        setDialogVisible(false);
                        setDialogCallback(null);  // Clear the callback when dismissed
                    }}
                    style={styles.dialogContainer}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text>{dialogMessage.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        {dialogCallback ? (
                            // Show both Cancel and Confirm buttons for delete confirmation
                            <>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setDialogVisible(false);
                                        setDialogCallback(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        dialogCallback();
                                        setDialogVisible(false);
                                        setDialogCallback(null);
                                    }}
                                    style={{ marginLeft: 8 }}
                                >
                                    Confirm
                                </Button>
                            </>
                        ) : (
                            // Show just OK button for regular alerts
                            <Button
                                mode="contained"
                                onPress={() => {
                                    setDialogVisible(false);
                                    setDialogCallback(null);
                                }}
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
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.borderRadius,
    },
    registrationCard: {
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
    registrationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    infoSection: {
        flex: 1,
        marginRight: 16,
    },
    statusSection: {
        alignItems: 'flex-end',
    },
    groupTitle: {
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
        backgroundColor: COLORS.chip,
        borderRadius: 20,
    },
    chipTextStyle: {
        color: COLORS.chipText,
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
        backgroundColor: COLORS.filterButton,
    },
    filterButtonLabel: {
        color: COLORS.filterButtonText,
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
        backgroundColor: COLORS.white,
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
        color: COLORS.pageText,
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
        color: COLORS.emptyText,
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
});

export default HomegroupMemberList;
