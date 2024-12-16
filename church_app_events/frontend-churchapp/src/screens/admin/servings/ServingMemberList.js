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
    getAllServingRsvps,
    deleteServingRsvp,
    sendConfirmationEmail,
    sendDeclineEmail,
    searchServingRsvps,
    updateServingRsvp,
} from "../../../services/servings/servingRsvpService";
import { showAlert } from '../../constants/constants';
import { useAuth } from '../../../contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

const ServingMemberList = () => {
    const { user: currentUser } = useAuth();
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
            const registrationList = await getAllServingRsvps();

            // Calculate status counts from the registrations array
            const status_counts = (registrationList || []).reduce((acc, reg) => {
                const status = reg.rsvp_status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {
                confirmed: 0,
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
                    confirmed: 0,
                    pending: 0,
                    declined: 0
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRegistration = async (registrationId) => {
        setDialogMessage({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this registration? This action cannot be undone.'
        });
        setDialogVisible(true);
        setDialogCallback(() => async () => {
            try {
                await deleteServingRsvp(registrationId);
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
            await updateServingRsvp(registration.id, 'confirmed');

            const registrationData = {
                rsvp_id: registration.id,
                email: registration.email,
                name: registration.name || registration.email?.split('@')[0],
                serving_id: registration.serving_id,
                user_id: currentUser?.id || null,
                logged_in_user: currentUser?.email || null
            };

            console.log('Sending confirmation with data:', registrationData);
            await sendConfirmationEmail(registrationData, currentUser);
            await fetchRegistrations();
            handleAlert('Success', 'Registration confirmed and notification email sent successfully');
        } catch (error) {
            console.error('Error confirming registration:', error);
            handleAlert('Error', error.message || 'Failed to confirm registration. Please try again.');
        }
    };

    const handleDeclineRegistration = async (registration) => {
        try {
            await updateServingRsvp(registration.id, 'declined');

            const registrationData = {
                rsvp_id: registration.id,
                email: registration.email,
                name: registration.name || registration.email?.split('@')[0],
                serving_id: registration.serving_id,
                user_id: currentUser?.id || null,
                logged_in_user: currentUser?.email || null
            };

            console.log('Sending decline with data:', registrationData);
            await sendDeclineEmail(registrationData, currentUser);
            await fetchRegistrations();
            handleAlert('Success', 'Registration declined and notification email sent successfully');
        } catch (error) {
            console.error('Error declining registration:', error);
            handleAlert('Error', error.message || 'Failed to decline registration. Please try again.');
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
                searchCriteria.rsvp_status = selectedStatus;
            }

            const registrationList = await searchServingRsvps(searchCriteria);

            // Handle the case where registrationList might be null or undefined
            if (!registrationList) {
                setRegistrationData({
                    registrations: [],
                    total: 0,
                    status_counts: {
                        confirmed: 0,
                        pending: 0,
                        declined: 0
                    }
                });
                return;
            }

            // Calculate status counts from the registrations array
            const status_counts = registrationList.reduce((acc, reg) => {
                const status = reg.rsvp_status || 'pending';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {
                confirmed: 0,
                pending: 0,
                declined: 0
            });

            setRegistrationData({
                registrations: registrationList,
                total: registrationList.length,
                status_counts: status_counts
            });
        } catch (error) {
            console.error('Error searching registrations:', error);
            handleAlert('Error', 'Failed to search registrations. Please try again.');
            setRegistrationData({
                registrations: [],
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

    const handleStatusFilter = async (status) => {
        if (selectedStatus === status) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(status);
        }
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
            case 'confirmed':
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

    const renderItem = ({ item }) => {
        const status = item.rsvp_status || 'pending';

        return (
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
                                    {item.serving_title || 'No Serving Title'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <IconButton
                                    icon="map-marker-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>
                                    {item.serving_location || 'No Location'}
                                </Text>
                            </View>
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
                                    Registered: {item.rsvp_date
                                        ? new Date(item.rsvp_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'Date not available'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statusSection}>
                            <Chip
                                style={[
                                    styles.statusChip,
                                    { backgroundColor: getStatusColor(status) }
                                ]}
                                textStyle={styles.statusText}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Chip>
                        </View>
                    </View>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    <Button
                        mode="outlined"
                        onPress={() => handleConfirmRegistration(item)}
                        disabled={status === 'confirmed'}
                        style={[styles.actionButton,
                        status !== 'confirmed' &&
                        styles.confirmButton]}
                        labelStyle={styles.actionButtonLabel}
                        icon="check-circle"
                    >
                        Confirm
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() => handleDeclineRegistration(item)}
                        disabled={status === 'declined'}
                        style={[styles.actionButton,
                        status !== 'declined' &&
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
    };

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const paginatedRegistrations = registrationData.registrations.slice(startIndex, endIndex);

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
                            Confirmed: {registrationData.status_counts.confirmed || 0}
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
                        setDialogCallback(null);
                    }}
                    style={styles.dialogContainer}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text>{dialogMessage.message}</Text>
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
    background: '#f5f5f5',
    white: '#fff',
    border: '#e0e0e0',
    text: '#333',
    success: '#4CAF50',
    error: '#F44336',
    shadow: '#000',
    chip: '#e0e0e0',
    chipText: '#333',
    filterButton: '#e0e0e0',
    filterButtonText: '#333',
    pageText: '#333',
    emptyText: '#333',
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

export default ServingMemberList;
