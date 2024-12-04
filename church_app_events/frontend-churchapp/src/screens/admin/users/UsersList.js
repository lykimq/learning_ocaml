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
import { getUsers, deleteUser, searchUsers } from "../../../services/userService";
import UserForm from "./UserForm";
import { showAlert } from "../../constants/constants";

const ITEMS_PER_PAGE = 10;

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingUser, setEditingUser] = useState(null);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersList = await getUsers();
            setUsers(usersList);
        } catch (error) {
            console.error('Error fetching users:', error);
            handleAlert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const handleDeleteUser = (id) => {
        setUserToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteUser(userToDelete);
            fetchUsers();
            handleAlert('Success', 'User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            handleAlert('Error', 'Failed to delete user');
        } finally {
            setDeleteConfirmVisible(false);
            setUserToDelete(null);
        }
    };

    const handleFormSubmit = () => {
        setEditingUser(null);
        fetchUsers();
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await searchUsers(searchQuery);
            setUsers(results);
            setCurrentPage(1);
        } catch (error) {
            console.error('Search failed:', error);
            handleAlert('Error', 'Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        fetchUsers();
    };

    const filteredUsers = users
        .filter((user) =>
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const lastNameA = a.last_name || '';
            const lastNameB = b.last_name || '';
            return lastNameA.localeCompare(lastNameB);
        });

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const renderItem = ({ item }) => {
        const firstInitial = item.first_name ? item.first_name[0] : '';
        const lastInitial = item.last_name ? item.last_name[0] : '';
        const initials = `${firstInitial}${lastInitial}`;

        return (
            <Card style={styles.userCard}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.userContainer}>
                        <Avatar.Text
                            size={50}
                            label={initials || '??'}
                            style={styles.avatar}
                        />
                        <View style={styles.userDetails}>
                            <Title style={styles.userName}>
                                {`${item.first_name || ''} ${item.last_name || ''}`}
                            </Title>
                            <View style={styles.userInfo}>
                                <IconButton
                                    icon="email-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.email || 'No email'}</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <IconButton
                                    icon="phone-outline"
                                    size={16}
                                    color="#666"
                                    style={styles.infoIcon}
                                />
                                <Text style={styles.infoText}>{item.phone || 'No phone'}</Text>
                            </View>
                        </View>
                    </View>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    <Button
                        mode="outlined"
                        onPress={() => handleEditUser(item)}
                        style={styles.actionButton}
                        labelStyle={styles.actionButtonLabel}
                        icon="pencil"
                    >
                        Edit
                    </Button>
                    <Portal>
                        <Dialog
                            visible={deleteConfirmVisible}
                            onDismiss={() => setDeleteConfirmVisible(false)}
                        >
                            <Dialog.Title>Confirm Delete</Dialog.Title>
                            <Dialog.Content>
                                <Text>Are you sure you want to delete this user? This action cannot be undone.</Text>
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
                    <Button
                        mode="outlined"
                        onPress={() => handleDeleteUser(item.id)}
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

    if (editingUser) {
        return (
            <View style={styles.editContainer}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={() => setEditingUser(null)}
                    />
                    <Title style={styles.headerTitle}>Edit User</Title>
                </View>
                <UserForm
                    userData={editingUser}
                    onSubmit={handleFormSubmit}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search users"
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
                <Text style={styles.loadingText}>Loading users...</Text>
            ) : (
                <FlatList
                    data={paginatedUsers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {filteredUsers.length > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= filteredUsers.length}
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

export default UsersList;
