import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Share, ToastAndroid, InteractionManager } from 'react-native';
import { Title, Paragraph, Card, Chip, IconButton, Avatar, Button, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TouchableOpacity } from 'react-native';
import { Portal, Dialog, List, TextInput } from 'react-native-paper';
import { memo } from 'react';

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
    const [showPlaylistViewer, setShowPlaylistViewer] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const embedHeight = width * 0.5625; // 16:9 aspect ratio
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [inputKey, setInputKey] = useState(0);

    // Function handle playlist creation
    const createNewPlaylist = async (playlistName) => {
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                showToast('Error: Invalid video');
                return;
            }

            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            // Check for duplicate playlist name
            if (Object.values(userPlaylists).some(p => p.name.toLowerCase() === playlistName.toLowerCase())) {
                showToast('A playlist with this name already exists');
                return;
            }

            const newPlaylist = {
                id: Date.now().toString(),
                name: playlistName,
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

            await loadPlaylists(); // Refresh playlists
            setIsSaved(true);
            setSaveModalVisible(false);
            showToast('Playlist created and video saved');
        } catch (error) {
            console.error('Error creating playlist:', error);
            showToast('Error creating playlist');
        }
    };

    // Load playlists
    const loadPlaylists = async () => {
        try {
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);
            const sortedPlaylists = Object.values(userPlaylists).sort((a, b) =>
                b.created_at.localeCompare(a.created_at)
            );
            setPlaylists(sortedPlaylists);
            return sortedPlaylists;
        } catch (error) {
            console.error('Error loading playlists:', error);
            showToast('Error loading playlists');
            return [];
        }
    };

    // Save to specific playlist
    const saveToPlaylist = async (playlistId) => {
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                showToast('Error: Invalid video');
                return;
            }

            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            if (!userPlaylists[playlistId]) {
                showToast('Error: Playlist not found');
                return;
            }

            // Check if video already exists
            const videoExists = userPlaylists[playlistId].videos.some(v => v.videoId === videoKey);

            if (videoExists) {
                // If video exists, remove it instead
                await removeFromPlaylist(playlistId);
                return;
            }

            // Add video if it doesn't exist
            userPlaylists[playlistId].videos.push({
                videoId: videoKey,
                title: media.title || '',
                thumbnailUrl: media.thumbnailUrl || '',
                added_at: new Date().toISOString()
            });

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            await loadPlaylists();
            setIsSaved(true);
            showToast('Video saved to playlist');
        } catch (error) {
            console.error('Error saving to playlist:', error);
            showToast('Error saving video');
        }
    };

    // Add this function to handle video removal from playlist
    const removeFromPlaylist = async (playlistId) => {
        try {
            const videoKey = getYoutubeVideoId();
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            if (userPlaylists[playlistId]) {
                // Remove video from playlist
                const updatedVideos = userPlaylists[playlistId].videos.filter(
                    video => video.videoId !== videoKey
                );

                userPlaylists[playlistId].videos = updatedVideos;
                await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));

                // Check if video exists in any playlist
                const videoExistsInAnyPlaylist = Object.values(userPlaylists).some(
                    playlist => playlist.videos.some(v => v.videoId === videoKey)
                );

                setIsSaved(videoExistsInAnyPlaylist);
                await loadPlaylists(); // Refresh playlists
                showToast('Video removed from playlist');
            }
        } catch (error) {
            console.error('Error removing from playlist:', error);
            showToast('Error removing video');
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

    const handleSave = async () => {
        try {
            setNewPlaylistName(''); // Reset the input
            setShowNewPlaylistInput(false); // Reset the input visibility
            await loadPlaylists(); // Load existing playlists
            setSaveModalVisible(true);
        } catch (error) {
            console.error('Error handling save:', error);
        }
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

    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        }
        // Add iOS notification handling if needed
    };

    const PlaylistInput = memo(({ onSubmit, onCancel }) => {
        const [inputValue, setInputValue] = useState('');
        const inputRef = useRef(null);

        const handleSubmit = () => {
            if (inputValue.trim()) {
                onSubmit(inputValue.trim());
                setInputValue('');
            }
        };

        return (
            <View style={styles.newPlaylistContainer}>
                <TextInput
                    ref={inputRef}
                    key={inputKey}
                    mode="outlined"
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Enter playlist name"
                    style={styles.playlistInput}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    maxLength={50}
                />
                <View style={styles.playlistButtonContainer}>
                    <Button
                        onPress={onCancel}
                        style={styles.playlistButton}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={styles.playlistButton}
                        disabled={!inputValue.trim()}
                    >
                        Create
                    </Button>
                </View>
            </View>
        );
    }, (prevProps, nextProps) => true); // Always prevent re-renders

    const renderLikeButton = () => (
        <Button
            icon={isLiked ? "thumb-up" : "thumb-up-outline"}
            mode="text"
            onPress={handleLike}
            style={[styles.actionButton, isLiked && styles.likedButton]}
        >
            Like
        </Button>
    );

    const SaveModal = () => {
        const videoKey = getYoutubeVideoId();

        const handleCreateNewPlaylist = useCallback((playlistName) => {
            createNewPlaylist(playlistName);
            setShowNewPlaylistInput(false);
            setInputKey(prev => prev + 1); // Reset input
        }, []);

        const handleCancelInput = useCallback(() => {
            setShowNewPlaylistInput(false);
            setInputKey(prev => prev + 1); // Reset input
        }, []);

        const renderPlaylistItems = useMemo(() => (
            <List.Section>
                {playlists.map(playlist => {
                    const isVideoInPlaylist = playlist.videos?.some(v => v.videoId === videoKey);
                    const uniqueVideos = playlist.videos?.filter((v, i, self) =>
                        self.findIndex(t => t.videoId === v.videoId) === i
                    );
                    const videoCount = uniqueVideos?.length || 0;

                    return (
                        <List.Item
                            key={playlist.id}
                            title={playlist.name}
                            description={`${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
                            left={props => <List.Icon {...props} icon="playlist-play" />}
                            right={props =>
                                isVideoInPlaylist ?
                                    <List.Icon {...props} icon="check" color="#4CAF50" /> :
                                    null
                            }
                            onPress={() => {
                                if (isVideoInPlaylist) {
                                    removeFromPlaylist(playlist.id);
                                } else {
                                    saveToPlaylist(playlist.id);
                                }
                            }}
                            style={[
                                styles.playlistItem,
                                isVideoInPlaylist && styles.savedPlaylistItem
                            ]}
                        />
                    );
                })}
            </List.Section>
        ), [playlists, videoKey]);

        return (
            <Portal>
                <Dialog
                    visible={saveModalVisible}
                    onDismiss={() => {
                        setSaveModalVisible(false);
                        setShowNewPlaylistInput(false);
                        setInputKey(prev => prev + 1); // Reset input
                    }}
                    style={styles.saveDialog}
                >
                    <Dialog.Title>Save to...</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView>
                            {renderPlaylistItems}
                            {showNewPlaylistInput ? (
                                <PlaylistInput
                                    onSubmit={handleCreateNewPlaylist}
                                    onCancel={handleCancelInput}
                                />
                            ) : (
                                <List.Item
                                    title="Create new playlist"
                                    left={props => <List.Icon {...props} icon="playlist-plus" />}
                                    onPress={() => setShowNewPlaylistInput(true)}
                                    style={styles.createPlaylistItem}
                                />
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                </Dialog>
            </Portal>
        );
    };

    const PlaylistViewer = () => (
        <Portal>
            <Dialog
                visible={showPlaylistViewer}
                onDismiss={() => setShowPlaylistViewer(false)}
                style={styles.playlistDialog}
            >
                <Dialog.Title>Your Playlists</Dialog.Title>
                <Dialog.Content>
                    <ScrollView style={styles.playlistScroll}>
                        {playlists.map(playlist => (
                            <List.Item
                                key={playlist.id}
                                title={playlist.name}
                                description={`${playlist.videos?.length || 0} ${playlist.videos?.length === 1 ? 'video' : 'videos'}`}
                                left={props => <List.Icon {...props} icon="playlist-play" />}
                                onPress={() => {
                                    setSelectedPlaylist(playlist);
                                    setShowPlaylistViewer(false);
                                    // Navigate to playlist detail screen if you have one
                                    // navigation.navigate('PlaylistDetail', { playlist });
                                }}
                                style={styles.playlistItem}
                            />
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowPlaylistViewer(false)}>Close</Button>
                </Dialog.Actions>
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
                            {renderLikeButton()}
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
                            <Button
                                icon="playlist-play"
                                mode="text"
                                onPress={() => setShowPlaylistViewer(true)}
                                style={styles.actionButton}
                            >
                                Playlists
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
            <PlaylistViewer />
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
        minWidth: 70,
        marginHorizontal: 4,
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
        padding: 16,
        backgroundColor: 'white',
    },
    playlistInput: {
        backgroundColor: 'white',
        marginBottom: 8,
    },
    playlistButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    playlistButton: {
        minWidth: 80,
    },
    saveDialog: {
        maxHeight: '80%',
    },
    playlistDialog: {
        maxHeight: '90%',
    },
    playlistScroll: {
        maxHeight: 400,
    },
    playlistItem: {
        height: 60,
        justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
    },
    createPlaylistItem: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e0e0e0',
        marginTop: 8,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    savedPlaylistItem: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    dialogScrollArea: {
        paddingHorizontal: 0,
    },
});

export default MediaDetails;
