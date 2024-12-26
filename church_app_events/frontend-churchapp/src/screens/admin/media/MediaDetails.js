import React, { useState, useEffect } from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Share } from 'react-native';
import { Title, Paragraph, Card, Chip, IconButton, Avatar, Button, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TouchableOpacity } from 'react-native';
import { Portal, Dialog, List, TextInput } from 'react-native-paper';

const MediaDetails = ({ route }) => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { media } = route.params;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
    const embedHeight = width * 0.5625; // 16:9 aspect ratio

    // Function handle playlist creation
    const createNewPlaylist = async () => {
        try {
            if (!newPlaylistName.trim()) return;

            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                console.error('No valid video ID found');
                return;
            }

            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            const newPlaylist = {
                id: Date.now().toString(),
                name: newPlaylistName,
                videos: [{
                    videoId: videoKey,
                    title: media.title || '',
                    thumbnailUrl: media.thumbnailUrl || '',
                    added_at: new Date().toISOString()
                }],
                created_at: new Date().toISOString()
            };

            userPlaylists[newPlaylist.id] = newPlaylist;
            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));

            setPlaylists(Object.values(userPlaylists));
            setNewPlaylistName('');
            setShowNewPlaylistInput(false);
            setSaveModalVisible(false);
            setIsSaved(true);

            console.log('New playlist created:', newPlaylist);
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    // Load playlists
    const loadPlaylists = async () => {
        try {
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);
            setPlaylists(Object.values(userPlaylists));
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    };

    // Save to specific playlist
    const saveToPlaylist = async (playlistId) => {
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                console.error('No valid video ID found');
                return;
            }

            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            if (!userPlaylists[playlistId]) {
                console.error('Playlist not found');
                return;
            }

            // Check if video is already in playlist
            const videoExists = userPlaylists[playlistId].videos.some(v => v.videoId === videoKey);

            if (!videoExists) {
                userPlaylists[playlistId].videos.push({
                    videoId: videoKey,
                    title: media.title || '',
                    thumbnailUrl: media.thumbnailUrl || '',
                    added_at: new Date().toISOString()
                });
            }

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            setIsSaved(true);
            setSaveModalVisible(false);
        } catch (error) {
            console.error('Error saving to playlist:', error);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [media.id]);


    const loadInitialData = async () => {
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                console.error('No valid video ID found');
                return;
            }

            // Load liked status
            const storedLikes = await AsyncStorage.getItem('likedVideos');
            const likedVideos = storedLikes ? JSON.parse(storedLikes) : {};
            setIsLiked(!!likedVideos[videoKey]);

            // Load saved status
            const savedMedia = await AsyncStorage.getItem('savedMedia');
            const savedVideos = savedMedia ? JSON.parse(savedMedia) : {};
            setIsSaved(!!savedVideos[videoKey]);

            // Load subscribed status
            const subscribedChannels = await AsyncStorage.getItem('subscribedChannels');
            const channels = subscribedChannels ? JSON.parse(subscribedChannels) : {};
            setIsSubscribed(!!channels[media.channelId]);

            // Set initial like count
            setLikeCount(media.likes || 0);

            console.log('Initial data loaded:', {
                videoKey,
                isLiked: !!likedVideos[videoKey],
                isSaved: !!savedVideos[videoKey],
                isSubscribed: !!channels[media.channelId],
                likeCount: media.likes || 0,
                views: media.views || 0
            });
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };


    const handleLike = async () => {
        try {
            // Get the correct video ID to use as the key
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                console.error('No valid video ID found');
                return;
            }

            // Get current liked videos from storage
            let likedVideos = {};
            try {
                const storedLikes = await AsyncStorage.getItem('likedVideos');
                likedVideos = storedLikes ? JSON.parse(storedLikes) : {};
            } catch (parseError) {
                console.warn('Error parsing stored likes, resetting:', parseError);
            }

            // Toggle like status
            const newIsLiked = !isLiked;

            // Update liked videos object
            if (newIsLiked) {
                likedVideos[videoKey] = {
                    timestamp: new Date().toISOString(),
                    title: media.title || '',
                    thumbnailUrl: media.thumbnailUrl || ''
                };
                setLikeCount(prev => prev + 1);
            } else {
                delete likedVideos[videoKey];
                setLikeCount(prev => Math.max(0, prev - 1));
            }

            // Save to AsyncStorage
            await AsyncStorage.setItem('likedVideos', JSON.stringify(likedVideos));
            setIsLiked(newIsLiked);

            console.log(`Video ${newIsLiked ? 'liked' : 'unliked'}: ${videoKey}`);
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };


    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Check out this video: ${media.title}\nhttps://youtube.com/watch?v=${videoId}`,
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log('Shared with activity type of', result.activityType);
                } else {
                    console.log('Shared');
                }
            }
        } catch (error) {
            console.error('Error sharing media:', error);
        }
    };

    const handleSave = () => {
        setNewPlaylistName(''); // Reset the input
        setShowNewPlaylistInput(false); // Reset the input visibility
        loadPlaylists();
        setSaveModalVisible(true);
    };

    const handleSubscribe = async () => {
        try {
            // Get channel ID from media object
            const channelId = media.channelId || media.snippet?.channelId;

            if (!channelId) {
                console.error('No channel ID found in media:', media);
                return;
            }

            const subscribedChannels = JSON.parse(await AsyncStorage.getItem('subscribedChannels')) || {};
            const newIsSubscribed = !isSubscribed;

            if (newIsSubscribed) {
                subscribedChannels[channelId] = {
                    timestamp: new Date().toISOString(),
                    channelTitle: media.channelTitle || media.snippet?.channelTitle || '',
                    channelId: channelId
                };
            } else {
                delete subscribedChannels[channelId];
            }

            await AsyncStorage.setItem('subscribedChannels', JSON.stringify(subscribedChannels));
            setIsSubscribed(newIsSubscribed);
            console.log(`Channel ${newIsSubscribed ? 'subscribed' : 'unsubscribed'}: ${channelId}`);
        } catch (error) {
            console.error('Error subscribing to channel:', error);
        }
    };


    // Extract video ID from YouTube URL or use the provided ID
    const getYoutubeVideoId = () => {
        if (!media) return '';

        // If media.id is an object with videoId property
        if (media.id?.videoId) return media.id.videoId;

        // If media.id is the video ID string
        if (typeof media.id === 'string') return media.id;

        // If media.videoId exists
        if (media.videoId) return media.videoId;

        // If there's a URL, try to extract ID from it
        if (media.url) {
            const match = media.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^\/&\?]{10,12})/);
            return match ? match[1] : '';
        }

        return '';
    };

    const videoId = getYoutubeVideoId();

    const formatViewCount = (count) => {
        if (!count) return '0';
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const renderVideoPlayer = () => {
        const videoKey = getYoutubeVideoId();
        console.log('Video Key:', videoKey); // Debug log

        if (!videoKey) {
            console.error('No valid video ID found');
            return null;
        }

        if (Platform.OS === 'web') {
            const embedUrl = `https://www.youtube.com/embed/${videoKey}?rel=0&autoplay=0&controls=1&modestbranding=1`;
            console.log('Web Embedding URL:', embedUrl);

            return (
                <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}>
                    <WebView
                        style={[styles.video, { height: embedHeight }]}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        source={{ uri: embedUrl }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView error: ', nativeEvent);
                        }}
                    />
                    <IconButton
                        icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                        onPress={() => setIsFullscreen(!isFullscreen)}
                        style={styles.fullscreenButton}
                    />
                </View>
            );
        } else {
            // For Android and iOS
            console.log('Rendering YoutubePlayer for mobile');
            return (
                <View style={styles.videoContainer}>
                    <YoutubePlayer
                        height={embedHeight}
                        width={width}
                        videoId={videoKey}
                        play={false}
                        onError={(error) => {
                            console.error('YouTube Player Error:', error);
                        }}
                        onReady={() => {
                            console.log('YouTube Player is ready');
                        }}
                        onChangeState={(state) => {
                            console.log('YouTube Player state changed:', state);
                        }}
                        forceAndroidAutoplay={false}
                        webViewProps={{
                            androidLayerType: Platform.OS === 'android' ? 'hardware' : undefined,
                            androidHardwareAccelerationDisabled: false,
                            onLoadStart: () => console.log('Video loading started'),
                            onLoadEnd: () => console.log('Video loading completed'),
                            javaScriptEnabled: true,
                            domStorageEnabled: true,
                            allowsFullscreenVideo: true,
                            renderToHardwareTextureAndroid: true,
                            startInLoadingState: true,
                            allowsInlineMediaPlayback: true,
                        }}
                        initialPlayerParams={{
                            preventFullScreen: false,
                            controls: true,
                            modestbranding: true,
                            showClosedCaptions: false,
                            rel: false,
                            loop: false,
                            fs: true,
                            playsinline: true,
                            iv_load_policy: 3,
                        }}
                    />
                </View>
            );
        }
    };

    const SaveModal = () => (
        <Portal>
            <Dialog visible={saveModalVisible} onDismiss={() => setSaveModalVisible(false)}>
                <Dialog.Title>Save to...</Dialog.Title>
                <Dialog.Content>
                    <List.Section>
                        {playlists.map(playlist => (
                            <List.Item
                                key={playlist.id}
                                title={playlist.name}
                                left={props => <List.Icon {...props} icon="playlist-play" />}
                                onPress={() => saveToPlaylist(playlist.id)}
                            />
                        ))}
                    </List.Section>
                    {showNewPlaylistInput ? (
                        <View style={styles.newPlaylistContainer}>
                            <TextInput
                                mode="outlined"
                                value={newPlaylistName}
                                onChangeText={setNewPlaylistName}
                                placeholder="Enter playlist name"
                                style={styles.playlistInput}
                                autoFocus
                            />
                            <View style={styles.playlistButtonContainer}>
                                <Button
                                    onPress={() => setShowNewPlaylistInput(false)}
                                    style={styles.playlistButton}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={createNewPlaylist}
                                    style={styles.playlistButton}
                                    disabled={!newPlaylistName.trim()}
                                >
                                    Create
                                </Button>
                            </View>
                        </View>
                    ) : (
                        <List.Item
                            title="Create new playlist"
                            left={props => <List.Icon {...props} icon="playlist-plus" />}
                            onPress={() => setShowNewPlaylistInput(true)}
                        />
                    )}
                </Dialog.Content>
            </Dialog>
        </Portal>
    );

    return (
        <View style={styles.container}>
            {renderVideoPlayer()}
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Title style={styles.title}>{media.title}</Title>
                    <View style={styles.metaContainer}>
                        <View style={styles.viewsDate}>
                            <MaterialIcons name="visibility" size={16} color="#666" />
                            <Text style={styles.metaText}>
                                {formatViewCount(media.views || 0)} views • {new Date(media.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <Button
                                icon="thumb-up"
                                mode="text"
                                onPress={handleLike}
                                style={[
                                    styles.actionButton,
                                    isLiked && styles.likedButton
                                ]}
                            >
                                {isLiked ? 'Liked' : 'Like'} {likeCount > 0 && `(${likeCount})`}
                            </Button>
                            <Button
                                icon="share"
                                mode="text"
                                onPress={handleShare}
                                style={styles.actionButton}
                            >
                                Share
                            </Button>
                            <Button
                                icon="playlist-plus"
                                mode="text"
                                onPress={handleSave}
                                style={styles.actionButton}
                            >
                                Save
                            </Button>
                        </View>
                    </View>
                </View>

                <Card style={styles.descriptionCard}>
                    <Card.Content>
                        <View style={styles.channelInfo}>
                            <Avatar.Icon size={40} icon="account" />
                            <View style={styles.channelText}>
                                <Title style={styles.channelName}>
                                    {media.channelTitle || 'Channel Name'}
                                </Title>
                                <Paragraph style={styles.subscriberCount}>
                                    {media.subscriberCount || '0'} subscribers
                                </Paragraph>
                            </View>
                            <Button mode="contained" style={styles.subscribeButton} onPress={handleSubscribe}>
                                Subscribe
                            </Button>
                        </View>
                        <Paragraph style={styles.description}>
                            {media.description}
                        </Paragraph>
                    </Card.Content>
                </Card>

                {/* You can add related videos section here */}
            </ScrollView>
            <SaveModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    videoContainer: {
        width: '100%',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: Platform.OS === 'web' ? 500 : 300,
        overflow: 'hidden',
    },
    fullscreenVideo: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    video: {
        width: '100%',
        backgroundColor: '#000',
        opacity: 0.99,
        flex: 1,
    },
    fullscreenButton: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    metaContainer: {
        marginTop: 12,
    },
    viewsDate: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaText: {
        marginLeft: 8,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
    },
    actionButton: {
        flex: 1,
    },
    descriptionCard: {
        margin: 16,
        elevation: 1,
    },
    channelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    channelText: {
        flex: 1,
        marginLeft: 12,
    },
    channelName: {
        fontSize: 16,
    },
    subscriberCount: {
        fontSize: 14,
        color: '#666',
    },
    subscribeButton: {
        backgroundColor: '#FF0000',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    likedButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    savedButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    subscribedButton: {
        backgroundColor: '#CC0000',
    },
    newPlaylistContainer: {
        marginTop: 10,
    },
    playlistInput: {
        marginBottom: 10,
    },
    playlistButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    playlistButton: {
        marginLeft: 10,
    },
});

export default MediaDetails;
