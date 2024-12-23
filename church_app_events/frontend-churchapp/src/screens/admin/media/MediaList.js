import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Card, Title, Paragraph, Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import { getAllContent } from '../../../services/media/mediaService';
import { StyleSheet } from 'react-native';

const CardComponent = ({ item, onPress }) => (
    <Card style={styles.card} onPress={onPress}>
        <Card.Cover
            source={{ uri: item.thumbnail_url || item.snippet?.thumbnails?.default?.url }}
            style={styles.thumbnail}
        />
        <Card.Content>
            <Title numberOfLines={2} style={styles.title}>
                {item.title || item.snippet?.title}
            </Title>
            <Paragraph numberOfLines={2} style={styles.description}>
                {item.description || item.snippet?.description}
            </Paragraph>
            <View style={styles.metaContainer}>
                <Chip
                    icon={item.source === 'youtube' ? 'youtube' : 'folder'}
                    style={styles.typeChip}
                >
                    {item.source === 'youtube' ? 'YouTube' : 'Saved'}
                </Chip>
            </View>
        </Card.Content>
    </Card>
);

const MediaList = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    const numColumns = Platform.select({
        web: Math.max(Math.floor(width / 300), 2),
        default: width > 600 ? 2 : 1
    });

    const loadMedia = async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const response = await getAllContent();
            console.log('Loaded media:', response); // Debug log
            setMedia(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || 'Failed to load content');
            console.error('Error loading content:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMedia();
    }, []);

    const handleVideoPress = (item) => {
        navigation.navigate('MediaDetails', {
            media: {
                id: item.id?.videoId || item.id,
                title: item.snippet?.title || item.title,
                description: item.snippet?.description || item.description,
                thumbnail_url: item.snippet?.thumbnails?.default?.url || item.thumbnail_url,
                channelTitle: item.snippet?.channelTitle,
                views: item.statistics?.viewCount,
                subscriberCount: null,
                media_type: 'youtube',
                source: 'youtube',
                created_at: item.snippet?.publishedAt || new Date().toISOString()
            }
        });
    };

    const getFilteredMedia = () => {
        if (!searchQuery) return media;
        return media.filter(item => {
            const title = item.title || item.snippet?.title || '';
            const description = item.description || item.snippet?.description || '';
            const searchLower = searchQuery.toLowerCase();
            return title.toLowerCase().includes(searchLower) ||
                description.toLowerCase().includes(searchLower);
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadMedia(true)}
                />
            }
        >
            <Searchbar
                placeholder="Search media..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />

            {error && (
                <View style={styles.errorContainer}>
                    <Paragraph style={styles.errorText}>{error}</Paragraph>
                </View>
            )}

            <View style={[styles.gridContainer, { gap: 16 }]}>
                {getFilteredMedia().map((item) => (
                    <CardComponent
                        key={`${item.source}-${item.id?.videoId || item.id || Date.now()}-${Math.random()}`}
                        item={item}
                        onPress={() => handleVideoPress(item)}
                    />
                ))}
            </View>
        </ScrollView>
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
    },
    gridContainer: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    card: {
        width: Platform.select({
            web: 280,
            default: '45%'
        }),
        margin: 8,
        elevation: 3,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    thumbnail: {
        height: 180,
    },
    title: {
        fontSize: 16,
        lineHeight: 20,
        marginTop: 8,
    },
    description: {
        fontSize: 14,
        lineHeight: 18,
        color: '#666',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    typeChip: {
        height: 24,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: {
        padding: 16,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
    },
});

export default MediaList;