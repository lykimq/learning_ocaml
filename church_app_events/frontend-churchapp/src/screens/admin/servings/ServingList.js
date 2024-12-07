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
    getAllServing,
    deleteServing,
    searchServings
} from "../../../services/servings/servingService";
import ServingForm from "./ServingForm";
import { showAlert } from "../../constants/constants";

const ITEMS_PER_PAGE = 10;

const ServingList = () => {
    const [servings, setServings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingServing, setEditingServing] = useState(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [servingToDelete, setServingToDelete] = useState(null);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    useEffect(() => {
        fetchServings();
    }, []);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const fetchServings = async () => {
        setLoading(true);
        try {
            const servingsList = await getAllServing();
            setServings(servingsList);
        } catch (error) {
            console.error('Error fetching servings:', error);
            handleAlert('Error', 'Failed to fetch servings');
        } finally {
            setLoading(false);
        }
    };

    const handleEditServing = (serving) => {
        setEditingServing(serving);
    };

    const handleDeleteServing = (id) => {
        setServingToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteServing(servingToDelete);
            fetchServings();
            handleAlert('Success', 'Serving deleted successfully');
        } catch (error) {
            console.error('Error deleting serving:', error);
            handleAlert('Error', 'Failed to delete serving');
        } finally {
            setDeleteConfirmVisible(false);
            setServingToDelete(null);
        }
    };

    const handleFormSubmit = () => {
        setEditingServing(null);
        fetchServings();
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await searchServings({ title: searchQuery });
            setServings(results);
            setCurrentPage(1);
        } catch (error) {
            console.error('Search failed:', error);
            handleAlert('Error', 'Failed to search servings');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchQuery('');
        fetchServings();
    };

    const filteredServings = servings
        .filter((serving) =>
            serving.title && serving.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.title.localeCompare(b.title));

    const paginatedServings = filteredServings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const renderItem = ({ item }) => {
        const servingInitials = item.title
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        return (
            <Card style={styles.userCard}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.userContainer}>
                        <Avatar.Text
                            size={50}
                            label={servingInitials || '??'}
                            style={styles.avatar}
                        />
                        <View style={styles.userDetails}>
                            <Title style={styles.userName}>{item.title}</Title>
                            <Text style={styles.infoText}>{item.description}</Text>
                        </View>
                    </View>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    <Button
                        mode="outlined"
                        onPress={() => handleEditServing(item)}
                        style={styles.actionButton}
                        labelStyle={styles.actionButtonLabel}
                        icon="pencil"
                    >
                        Edit
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() => handleDeleteServing(item.id)}
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

    if (editingServing) {
        return (
            <ServingForm
                servingData={editingServing}
                onSubmit={handleFormSubmit}
            />
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
                        <Text>Are you sure you want to delete this serving? This action cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteConfirmVisible(false)}>
                            Cancel
                        </Button>
                        <Button
                            onPress={confirmDelete}
                            textColor="#c62828"
                        >
                            Delete
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search servings"
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
                <Text style={styles.loadingText}>Loading servings...</Text>
            ) : (
                <FlatList
                    data={paginatedServings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {filteredServings.length > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Text style={styles.pageText}>
                        Page {currentPage} of {Math.ceil(filteredServings.length / ITEMS_PER_PAGE)}
                    </Text>
                    <Button
                        mode="text"
                        onPress={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * ITEMS_PER_PAGE >= filteredServings.length}
                    >
                        Next
                    </Button>
                </View>
            )}
        </View>
    )
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
        padding: 16,
    },
    userContainer: {
        flexDirection: 'column',
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
    },
    infoText: {
        color: '#333',
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
    deleteButton: {
        borderColor: COLORS.errorBorder,
    },
    deleteButtonLabel: {
        color: COLORS.error,
        fontSize: TYPOGRAPHY.button.fontSize,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
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
});

export default ServingList;
