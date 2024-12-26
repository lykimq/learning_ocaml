import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Share, ToastAndroid, InteractionManager, Image, Alert } from 'react-native';
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
    const [showPlaylistDetails, setShowPlaylistDetails] = useState(false);
    const [currentPlaylists, setCurrentPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewCount, setViewCount] = useState(0);

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
    const loadPlaylists = useCallback(async () => {
        try {
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);
            const sortedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos) // Add null check
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            // Update both states atomically
            setPlaylists(sortedPlaylists);
            setCurrentPlaylists(sortedPlaylists);
            return sortedPlaylists;
        } catch (error) {
            console.error('Error loading playlists:', error);
            showToast('Error loading playlists');
            return [];
        }
    }, []);

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

    // Add function to update view count
    const updateViewCount = useCallback(async () => {
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) return;

            // Get current views from storage
            const storedViews = await AsyncStorage.getItem('videoViews') || '{}';
            const viewsData = JSON.parse(storedViews);

            // Update view count
            const currentViews = (viewsData[videoKey] || 0) + 1;
            viewsData[videoKey] = currentViews;

            // Save updated views
            await AsyncStorage.setItem('videoViews', JSON.stringify(viewsData));
            setViewCount(currentViews);

        } catch (error) {
            console.error('Error updating view count:', error);
        }
    }, []);

    // Update loadInitialData to include view count
    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                console.error('No valid video ID found');
                return;
            }

            // Load all data in parallel
            const [storedLikes, savedMedia, subscribedChannels, playlistsData, storedViews] = await Promise.all([
                AsyncStorage.getItem('likedVideos'),
                AsyncStorage.getItem('savedMedia'),
                AsyncStorage.getItem('subscribedChannels'),
                AsyncStorage.getItem('userPlaylists'),
                AsyncStorage.getItem('videoViews')
            ]);

            const likedVideos = storedLikes ? JSON.parse(storedLikes) : {};
            const savedVideos = savedMedia ? JSON.parse(savedMedia) : {};
            const channels = subscribedChannels ? JSON.parse(subscribedChannels) : {};
            const userPlaylists = playlistsData ? JSON.parse(playlistsData) : {};
            const viewsData = storedViews ? JSON.parse(storedViews) : {};

            // Update all states
            setIsLiked(!!likedVideos[videoKey]);
            setIsSaved(!!savedVideos[videoKey]);
            setIsSubscribed(!!channels[media.channelId]);
            setLikeCount(media.likes || 0);
            setViewCount(viewsData[videoKey] || 0);

            // Sort and set playlists
            const sortedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            setPlaylists(sortedPlaylists);
            setCurrentPlaylists(sortedPlaylists);

            // Update view count when video is loaded
            await updateViewCount();

            console.log('Initial data loaded:', {
                videoKey,
                isLiked: !!likedVideos[videoKey],
                isSaved: !!savedVideos[videoKey],
                isSubscribed: !!channels[media.channelId],
                likeCount: media.likes || 0,
                views: viewsData[videoKey] || 0,
                playlistCount: sortedPlaylists.length
            });
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [media.id, media.channelId, media.likes, updateViewCount]);

    // Update useEffect to handle component mounting and updates
    useEffect(() => {
        let isMounted = true;

        const initializeData = async () => {
            if (isMounted) {
                await loadInitialData();
            }
        };

        initializeData();

        return () => {
            isMounted = false;
        };
    }, [loadInitialData]);

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

    const PlaylistDetailsModal = memo(({ playlist, visible, onDismiss }) => {
        if (!playlist) return null;

        // Find the current version of the playlist from currentPlaylists
        const currentPlaylist = currentPlaylists.find(p => p.id === playlist.id) || playlist;

        const renderThumbnail = (video) => {
            if (!video.thumbnailUrl) {
                return (
                    <View style={[styles.thumbnailContainer, styles.placeholderThumbnail]}>
                        <List.Icon icon="video" color="#666666" />
                    </View>
                );
            }

            return (
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                    />
                </View>
            );
        };

        return (
            <Portal>
                <Dialog
                    visible={visible}
                    onDismiss={onDismiss}
                    style={styles.playlistDetailsDialog}
                >
                    <Dialog.Title>{currentPlaylist.name}</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView>
                            {currentPlaylist.videos.length === 0 ? (
                                <List.Item
                                    title="No videos in playlist"
                                    description="Save some videos to see them here"
                                    left={props => <List.Icon {...props} icon="playlist-remove" />}
                                />
                            ) : (
                                currentPlaylist.videos.map((video, index) => (
                                    <List.Item
                                        key={`${video.videoId}-${index}`}
                                        title={video.title || 'Untitled Video'}
                                        description={`Added: ${new Date(video.added_at).toLocaleDateString()}`}
                                        left={() => renderThumbnail(video)}
                                        right={props => (
                                            <IconButton
                                                {...props}
                                                icon="delete"
                                                onPress={() => {
                                                    Alert.alert(
                                                        'Remove Video',
                                                        'Remove this video from the playlist?',
                                                        [
                                                            {
                                                                text: 'Cancel',
                                                                style: 'cancel'
                                                            },
                                                            {
                                                                text: 'Remove',
                                                                onPress: () => handleDeleteVideo(currentPlaylist.id, video.videoId),
                                                                style: 'destructive'
                                                            }
                                                        ]
                                                    );
                                                }}
                                            />
                                        )}
                                        style={styles.playlistVideoItem}
                                    />
                                ))
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={onDismiss}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    });

    // Update handleDeletePlaylistFromSave to also update currentPlaylists
    const handleDeletePlaylistFromSave = async (playlistId) => {
        try {
            // Update both states immediately
            setPlaylists(prevPlaylists =>
                prevPlaylists.filter(playlist => playlist.id !== playlistId)
            );
            setCurrentPlaylists(prevPlaylists =>
                prevPlaylists.filter(playlist => playlist.id !== playlistId)
            );

            // Update AsyncStorage
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            delete userPlaylists[playlistId];

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            showToast('Playlist deleted');
            setSaveModalVisible(false);
        } catch (error) {
            console.error('Error deleting playlist:', error);
            showToast('Error deleting playlist');
            // Reload both states in case of error
            const reloadedPlaylists = await loadPlaylists();
            setPlaylists(reloadedPlaylists);
            setCurrentPlaylists(reloadedPlaylists);
        }
    };

    // Update handleRemoveFromSave to also update currentPlaylists
    const handleRemoveFromSave = async (playlistId, videoId) => {
        try {
            // Update both states immediately
            const updatePlaylist = playlist => {
                if (playlist.id === playlistId) {
                    return {
                        ...playlist,
                        videos: playlist.videos.filter(v => v.videoId !== videoId)
                    };
                }
                return playlist;
            };

            setPlaylists(prevPlaylists => prevPlaylists.map(updatePlaylist));
            setCurrentPlaylists(prevPlaylists => prevPlaylists.map(updatePlaylist));

            // Update AsyncStorage
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            userPlaylists[playlistId].videos = userPlaylists[playlistId].videos.filter(
                v => v.videoId !== videoId
            );

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            showToast('Video removed from playlist');

            // Check if video exists in any playlist
            const videoExistsInAnyPlaylist = Object.values(userPlaylists).some(
                playlist => playlist.videos.some(v => v.videoId === videoId)
            );

            setIsSaved(videoExistsInAnyPlaylist);
        } catch (error) {
            console.error('Error removing video:', error);
            showToast('Error removing video');
            // Reload both states in case of error
            const reloadedPlaylists = await loadPlaylists();
            setPlaylists(reloadedPlaylists);
            setCurrentPlaylists(reloadedPlaylists);
        }
    };

    // Update SaveModal to use the new removal functions
    const SaveModal = () => {
        const videoKey = getYoutubeVideoId();

        return (
            <Portal>
                <Dialog
                    visible={saveModalVisible}
                    onDismiss={() => {
                        setSaveModalVisible(false);
                        setShowNewPlaylistInput(false);
                        setInputKey(prev => prev + 1);
                    }}
                    style={styles.saveDialog}
                >
                    <Dialog.Title>Save to...</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView>
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
                                            right={props => (
                                                <View style={styles.playlistItemActions}>
                                                    {isVideoInPlaylist && <List.Icon {...props} icon="check" color="#4CAF50" />}
                                                    <IconButton
                                                        icon="delete"
                                                        onPress={() => {
                                                            Alert.alert(
                                                                'Delete Playlist',
                                                                `Are you sure you want to delete "${playlist.name}"?`,
                                                                [
                                                                    {
                                                                        text: 'Cancel',
                                                                        style: 'cancel'
                                                                    },
                                                                    {
                                                                        text: 'Delete',
                                                                        onPress: () => handleDeletePlaylistFromSave(playlist.id),
                                                                        style: 'destructive'
                                                                    }
                                                                ]
                                                            );
                                                        }}
                                                    />
                                                </View>
                                            )}
                                            onPress={() => {
                                                if (isVideoInPlaylist) {
                                                    handleRemoveFromSave(playlist.id, videoKey);
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

    const handleDeletePlaylist = async (playlistId) => {
        try {
            // Update state immediately
            setCurrentPlaylists(prevPlaylists =>
                prevPlaylists.filter(playlist => playlist.id !== playlistId)
            );

            // Update AsyncStorage
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            delete userPlaylists[playlistId];

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            showToast('Playlist deleted');

            // Close modals if needed
            setShowPlaylistDetails(false);
            setSelectedPlaylist(null);
            setShowPlaylistViewer(true);
        } catch (error) {
            console.error('Error deleting playlist:', error);
            showToast('Error deleting playlist');
            // Reload playlists in case of error
            await loadPlaylists();
        }
    };

    // Add loading state to PlaylistViewer
    const PlaylistViewer = useMemo(() => {
        return () => (
            <Portal>
                <Dialog
                    visible={showPlaylistViewer}
                    onDismiss={() => setShowPlaylistViewer(false)}
                    style={styles.playlistDialog}
                >
                    <Dialog.Title>Your Playlists</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView style={styles.playlistScroll}>
                            {isLoading ? (
                                <List.Item
                                    title="Loading playlists..."
                                    left={props => <List.Icon {...props} icon="loading" />}
                                />
                            ) : currentPlaylists.length === 0 ? (
                                <List.Item
                                    title="No playlists"
                                    description="Create a playlist to get started"
                                    left={props => <List.Icon {...props} icon="playlist-plus" />}
                                />
                            ) : (
                                currentPlaylists.map(playlist => (
                                    <List.Item
                                        key={playlist.id}
                                        title={playlist.name}
                                        description={`${playlist.videos?.length || 0} ${playlist.videos?.length === 1 ? 'video' : 'videos'}`}
                                        left={props => <List.Icon {...props} icon="playlist-play" />}
                                        right={props => (
                                            <View style={styles.playlistItemActions}>
                                                <IconButton
                                                    icon="dots-vertical"
                                                    onPress={() => {
                                                        setSelectedPlaylist(playlist);
                                                        setShowPlaylistDetails(true);
                                                        setShowPlaylistViewer(false);
                                                    }}
                                                />
                                                <IconButton
                                                    icon="delete"
                                                    onPress={() => {
                                                        Alert.alert(
                                                            'Delete Playlist',
                                                            `Are you sure you want to delete "${playlist.name}"?`,
                                                            [
                                                                {
                                                                    text: 'Cancel',
                                                                    style: 'cancel'
                                                                },
                                                                {
                                                                    text: 'Delete',
                                                                    onPress: () => handleDeletePlaylist(playlist.id),
                                                                    style: 'destructive'
                                                                }
                                                            ]
                                                        );
                                                    }}
                                                />
                                            </View>
                                        )}
                                        onPress={() => {
                                            setSelectedPlaylist(playlist);
                                            setShowPlaylistDetails(true);
                                            setShowPlaylistViewer(false);
                                        }}
                                        style={styles.playlistItem}
                                    />
                                ))
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPlaylistViewer(false)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>

                <PlaylistDetailsModal
                    playlist={selectedPlaylist}
                    visible={showPlaylistDetails}
                    onDismiss={() => {
                        setShowPlaylistDetails(false);
                        setSelectedPlaylist(null);
                        setShowPlaylistViewer(true);
                    }}
                />
            </Portal>
        );
    }, [currentPlaylists, showPlaylistViewer, showPlaylistDetails, selectedPlaylist, isLoading]);

    // Add handleDeleteVideo at parent level
    const handleDeleteVideo = async (playlistId, videoId) => {
        try {
            // Update state immediately
            setCurrentPlaylists(prevPlaylists =>
                prevPlaylists.map(playlist => {
                    if (playlist.id === playlistId) {
                        return {
                            ...playlist,
                            videos: playlist.videos.filter(v => v.videoId !== videoId)
                        };
                    }
                    return playlist;
                })
            );

            // Update AsyncStorage
            const storedPlaylists = await AsyncStorage.getItem('userPlaylists') || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            userPlaylists[playlistId].videos = userPlaylists[playlistId].videos.filter(
                v => v.videoId !== videoId
            );

            await AsyncStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
            showToast('Video removed from playlist');
        } catch (error) {
            console.error('Error removing video:', error);
            showToast('Error removing video');
            // Reload playlists in case of error
            await loadPlaylists();
        }
    };

    // Add handleCreateNewPlaylist function
    const handleCreateNewPlaylist = async (playlistName) => {
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
            setShowNewPlaylistInput(false);
            showToast('Playlist created and video saved');
        } catch (error) {
            console.error('Error creating playlist:', error);
            showToast('Error creating playlist');
        }
    };

    // Add handleCancelInput function
    const handleCancelInput = () => {
        setShowNewPlaylistInput(false);
        setNewPlaylistName('');
        setInputKey(prev => prev + 1); // Reset input key if you're using it
    };

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
                                {formatViewCount(viewCount)} views • {new Date(media.created_at).toLocaleDateString()}
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

                {/* TODO: add related videos section here */}
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
    playlistDetailsDialog: {
        maxHeight: '90%',
    },
    thumbnailContainer: {
        width: 80,
        height: 45,
        marginRight: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    placeholderThumbnail: {
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
    },
    playlistVideoItem: {
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
    },
    playlistItemActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default MediaDetails;
