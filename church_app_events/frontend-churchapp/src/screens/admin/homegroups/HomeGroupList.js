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
    Dialog,
    Portal,
} from "react-native-paper";
import {
    getHomeGroups,
    deleteHomeGroup,
    searchHomeGroups
} from "../../../services/homegroups/homeGroupService";
import HomeGroupForm from "./HomeGroupForm";
import { showAlert } from "../../constants/constants";
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

const HomeGroupList = () => {
    const [homeGroups, setHomeGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingHomeGroup, setEditingHomeGroup] = useState(null);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [homeGroupToDelete, setHomeGroupToDelete] = useState(null);

    useEffect(() => {
        fetchHomeGroups();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const fetchHomeGroups = async () => {
        setLoading(true);
        try {
            const groupsList = await getHomeGroups();
            setHomeGroups(groupsList);
        } catch (error) {
            console.error('Error fetching home groups:', error);
            handleAlert('Error', 'Failed to fetch home groups');
        } finally {
            setLoading(false);
        }
    };

    const handleEditHomeGroup = (homeGroup) => {
        setEditingHomeGroup(homeGroup);
    };

    const handleDeleteHomeGroup = (id) => {
        setHomeGroupToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteHomeGroup(homeGroupToDelete);
            fetchHomeGroups();
            handleAlert('Success', 'Home group deleted successfully');
        } catch (error) {
            console.error('Error deleting home group:', error);
            handleAlert('Error', 'Failed to delete home group');
        } finally {
            setDeleteConfirmVisible(false);
            setHomeGroupToDelete(null);
        }
    };

    const handleFormSubmit = () => {
        setEditingHomeGroup(null);
        fetchHomeGroups();
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await searchHomeGroups({ name: searchQuery });
            setHomeGroups(results);
            setCurrentPage(1);
        } catch (error) {
            console.error('Search failed:', error);
            handleAlert('Error', 'Failed to search home groups');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        fetchHomeGroups();
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
            <Card style={styles.userCard}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.userContainer}>
                        {item.profile_picture ? (
                            <Avatar.Image
                                size={50}
                                source={{ uri: item.profile_picture }}
                                style={styles.avatar}
                            />
                        ) : (
                            <Avatar.Text
                                size={50}
                                label={groupInitials || '??'}
                                style={styles.avatar}
                            />
                        )}
                        <View style={styles.userDetails}>
                            <Title style={styles.userName}>
                                {item.name}
                            </Title>

                            {/* Description */}
                            {item.description && (
                                <View style={styles.userInfo}>
                                    <IconButton
                                        icon="information"
                                        size={16}
                                        color="#666"
                                        style={styles.infoIcon}
                                    />
                                    <Text style={styles.infoText}>{item.description}</Text>
                                </View>
                            )}

                            {/* Location */}
                            <View style={styles.userInfo}>
                                <IconButton
                                    icon="map-marker-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.location || 'No location'}</Text>
                            </View>

                            {/* Meeting Schedule */}
                            {(item.meeting_day || item.meeting_time) && (
                                <View style={styles.userInfo}>
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
                            )}

                            {/* Language */}
                            {item.language && (
                                <View style={styles.userInfo}>
                                    <IconButton
                                        icon="translate"
                                        size={16}
                                        color="#666"
                                        style={styles.infoIcon}
                                    />
                                    <Text style={styles.infoText}>Language: {item.language}</Text>
                                </View>
                            )}

                            {/* Capacity */}
                            {item.max_capacity && (
                                <View style={styles.userInfo}>
                                    <IconButton
                                        icon="account-group"
                                        size={16}
                                        color="#666"
                                        style={styles.infoIcon}
                                    />
                                    <Text style={styles.infoText}>Capacity: {item.max_capacity}</Text>
                                </View>
                            )}

                            {/* Created/Updated Info */}
                            <View style={styles.userInfo}>
                                <IconButton
                                    icon="clock-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>
                                    Created: {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <IconButton
                                    icon="update"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>
                                    Updated: {new Date(item.updated_at).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    <Button
                        mode="outlined"
                        onPress={() => handleEditHomeGroup(item)}
                        style={styles.actionButton}
                        labelStyle={styles.actionButtonLabel}
                        icon="pencil"
                    >
                        Edit
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() => handleDeleteHomeGroup(item.id)}
                        style={[styles.actionButton, styles.deleteButton]}
                        labelStyle={styles.deleteButtonLabel}
                        icon="delete"
                    >
                        Delete
                    </Button>
                </Card.Actions>
            </Card>
        );
    };

    if (editingHomeGroup) {
        return (
            <View style={styles.editContainer}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={() => setEditingHomeGroup(null)}
                    />
                    <Title style={styles.headerTitle}>Edit Home Group</Title>
                </View>
                <HomeGroupForm
                    homeGroupData={editingHomeGroup}
                    onSubmit={handleFormSubmit}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Portal>
                <Dialog
                    visible={deleteConfirmVisible}
                    onDismiss={() => setDeleteConfirmVisible(false)}
                >
                    <Dialog.Title>Confirm Delete</Dialog.Title>
                    <Dialog.Content>
                        <Text>Are you sure you want to delete this home group? This action cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteConfirmVisible(false)}>
                            Cancel
                        </Button>
                        <Button
                            onPress={confirmDelete}
                            textColor={COLORS.error}
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

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
    userCard: {
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
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: COLORS.blue,
    },
    userDetails: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    userInfo: {
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
    formContainer: {
        flex: 1,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.white,
        width: '100%',
    },
    editContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
});

export default HomeGroupList;
