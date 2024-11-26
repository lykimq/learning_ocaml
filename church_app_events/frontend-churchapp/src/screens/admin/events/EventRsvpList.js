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
    Chip,
    Portal,
    Dialog
} from "react-native-paper";
import { getAllRsvps, declineRsvp, getRsvpsByEmail, confirmRsvpWithEmail, declineRsvpWithEmail }
    from "../../../services/events/eventRsvpService";

const ITEMS_PER_PAGE = 10;

const EventRsvpList = () => {
    const [rsvps, setRsvps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogCallback, setDialogCallback] = useState(null);

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
            setRsvps(rsvpList)
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
            if (searchQuery.includes('@')) {
                const rsvpList = await getRsvpsByEmail(searchQuery);
                setRsvps(rsvpList);
            } else {
                const allRsvps = await getAllRsvps();
                const filtered = allRsvps.filter(rsvp =>
                    rsvp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    rsvp.event_title?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setRsvps(filtered);
            }
        } catch (error) {
            console.error('Error searching RSVPs:', error);
            showAlert('Error', 'Failed to search RSVPs');
        } finally {
            setLoading(false);
        }
    }
    const handleReset = () => {
        setCurrentPage(1);
        fetchRsvps();
        setSearchQuery('');
    }

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

    const paginatedRsvps = rsvps.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search by email or event title"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    onSubmitEditing={handleSearch}
                    style={styles.searchBar}
                />
                <View style={styles.filterRow}>
                    <Button
                        mode="outlined"
                        onPress={handleSearch}
                        style={styles.filterButton}
                    >
                        Search
                    </Button>
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
                <Text style={styles.loadingText}>Loading RSVPs...</Text>
            ) : (
                <FlatList
                    data={paginatedRsvps}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {rsvps.length > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(rsvps.length / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= rsvps.length}
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
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text>{dialogMessage.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => {
                                setDialogVisible(false);
                                if (dialogCallback) {
                                    dialogCallback();
                                    setDialogCallback(null);
                                }
                            }}
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
});


export default EventRsvpList;