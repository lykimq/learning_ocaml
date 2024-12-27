import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Card, Title, Paragraph, Chip, Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { getAllContent } from '../../../services/media/mediaService';
import { StyleSheet } from 'react-native';

const CardComponent = React.memo(({ item, onPress }) => (
    <Card style={styles.card} onPress={onPress}>
        <Card.Cover
            source={{ uri: item.thumbnail_url || item.snippet?.thumbnails?.default?.url }}
            style={styles.thumbnail}
            resizeMode="cover"
        />
        <Card.Content style={styles.cardContent}>
            <Title numberOfLines={2} style={styles.title}>
                {item.title || item.snippet?.title}
            </Title>
            <Paragraph numberOfLines={2} style={styles.description}>
                {item.description || item.snippet?.description}
            </Paragraph>
            <View style={styles.metaContainer}>
                <Chip
                    icon={item.source === 'youtube' ? 'youtube' : 'folder'}
                    style={[styles.typeChip, item.source === 'youtube' ? styles.youtubeChip : styles.savedChip]}
                >
                    {item.source === 'youtube' ? 'YouTube' : 'Saved'}
                </Chip>
                {item.snippet?.publishedAt && (
                    <Text style={styles.dateText}>
                        {new Date(item.snippet.publishedAt).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </Card.Content>
    </Card>
));

const MediaScreenUser = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    const loadMedia = useCallback(async (showRefreshing = false, isRetry = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else if (!isRetry) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await getAllContent();

            if (Array.isArray(response) && response.length > 0) {
                // Ensure each item has a unique key
                const processedMedia = response.map((item, index) => ({
                    ...item,
                    id: item.id || `${item.source}-${item.snippet?.resourceId?.videoId || index}-${Date.now()}`
                }));
                setMedia(processedMedia);
                setRetryCount(0); // Reset retry count on success
            } else if (retryCount < MAX_RETRIES) {
                // Retry loading if no data received
                console.log(`Retrying media load (${retryCount + 1}/${MAX_RETRIES})`);
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    loadMedia(showRefreshing, true);
                }, 1000 * (retryCount + 1)); // Exponential backoff
            } else {
                setError('No media content available');
            }
        } catch (err) {
            console.error('Error loading media:', err);
            if (retryCount < MAX_RETRIES) {
                // Retry on error
                console.log(`Retrying after error (${retryCount + 1}/${MAX_RETRIES})`);
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    loadMedia(showRefreshing, true);
                }, 1000 * (retryCount + 1));
            } else {
                setError(err.message || 'Failed to load content');
            }
        } finally {
            if (showRefreshing) setRefreshing(false);
            if (!isRetry) setLoading(false);
        }
    }, [retryCount]);

    useEffect(() => {
        let mounted = true;

        const initializeData = async () => {
            if (mounted) {
                await loadMedia();
            }
        };

        initializeData();

        return () => {
            mounted = false;
            setMedia([]);
        };
    }, [loadMedia]);

    const onRefresh = useCallback(() => {
        setRetryCount(0); // Reset retry count on manual refresh
        loadMedia(true);
    }, [loadMedia]);

    const getFilteredMedia = useCallback(() => {
        return searchQuery
            ? media.filter(item => {
                const title = (item.title || item.snippet?.title || '').toLowerCase();
                const description = (item.description || item.snippet?.description || '').toLowerCase();
                const searchLower = searchQuery.toLowerCase();
                return title.includes(searchLower) || description.includes(searchLower);
            })
            : media;
    }, [media, searchQuery]);

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading media...</Text>
            </View>
        );
    }

    // Calculate the number of columns based on the screen width
    const numColumns = Platform.select({
        ios: width > 600 ? 2 : 1,
        android: width > 600 ? 2 : 1,
        default: Math.max(Math.floor(width / 300), 2)
    });

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search media"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            <FlatList
                key={`mediaListUser-${numColumns}`}
                data={getFilteredMedia()}
                renderItem={({ item }) => (
                    <CardComponent
                        item={item}
                        onPress={() => navigation.navigate('MediaDetailsUser', { media: item })}
                    />
                )}
                keyExtractor={item => {
                    const baseId = item.id || item.snippet?.resourceId?.videoId || item.snippet?.videoId;
                    const timestamp = item.created_at || item.snippet?.publishedAt || Date.now();
                    const source = item.source || 'unknown';
                    return `${source}-${baseId}-${timestamp}`;
                }}
                numColumns={numColumns}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                contentContainerStyle={styles.gridContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {error || 'No media content available'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchBar: {
        margin: 16,
        elevation: 4,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    gridContainer: {
        padding: 8,
        paddingBottom: 16,
    },
    card: {
        flex: 1,
        margin: 8,
        elevation: 3,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    thumbnail: {
        height: 180,
        backgroundColor: '#e0e0e0',
    },
    cardContent: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        lineHeight: 22,
        marginTop: 4,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
        marginTop: 4,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    typeChip: {
        height: 28,
    },
    youtubeChip: {
        backgroundColor: '#FF0000',
    },
    savedChip: {
        backgroundColor: '#4A90E2',
    },
    dateText: {
        fontSize: 12,
        color: '#888',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#e41e3f',
        fontSize: 16,
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default MediaScreenUser;