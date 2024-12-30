import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Share, ToastAndroid, InteractionManager, Image, Alert } from 'react-native';
import { Title, IconButton, Button, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Portal, Dialog, List, TextInput } from 'react-native-paper';
import { memo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const MediaDetailsUser = ({ route }) => {
    const { user } = useAuth();

    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { media } = route.params;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
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

    // Create user-specific storage keys
    const getUserStorageKeys = () => ({
        playlists: `playlists_user_${user?.id}`,
        likes: `likes_user_${user?.id}`,
        saves: `saves_user_${user?.id}`,
        views: `views_user_${user?.id}`
    });

    // Check if user is authenticated
    const checkUserAuth = useCallback(() => {
        if (!user) {
            showToast('Please login to save this video');
            navigation.navigate('Login');
            return false;
        }
        return true;
    }, [user, navigation]);

    // Load playlists with user-specific key
    const loadPlaylists = useCallback(async () => {
        if (!user) return []; // Return empty if no user

        try {
            const { playlists: playlistKey } = getUserStorageKeys();
            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);
            const sortedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            setPlaylists(sortedPlaylists);
            setCurrentPlaylists(sortedPlaylists);
            return sortedPlaylists;
        } catch (error) {
            console.error('Error loading playlists:', error);
            showToast('Error loading playlists');
            return [];
        }
    }, [user]);

    // Update view count with user-specific key
    const updateViewCount = useCallback(async () => {
        if (!user) return;

        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) return;

            const { views: viewsKey } = getUserStorageKeys();
            const storedViews = await AsyncStorage.getItem(viewsKey) || '{}';
            const viewsData = JSON.parse(storedViews);

            const currentViews = (viewsData[videoKey] || 0) + 1;
            viewsData[videoKey] = currentViews;

            await AsyncStorage.setItem(viewsKey, JSON.stringify(viewsData));
            setViewCount(currentViews);
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    }, [user]);

    // Handle likes with user-specific key
    const handleLike = async () => {
        if (!checkUserAuth()) return;

        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) return;

            const { likes: likesKey } = getUserStorageKeys();
            let likedVideos = {};

            try {
                const storedLikes = await AsyncStorage.getItem(likesKey);
                likedVideos = storedLikes ? JSON.parse(storedLikes) : {};
            } catch (parseError) {
                console.warn('Error parsing stored likes, resetting:', parseError);
            }

            const newIsLiked = !isLiked;

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

            await AsyncStorage.setItem(likesKey, JSON.stringify(likedVideos));
            setIsLiked(newIsLiked);
        } catch (error) {
            console.error('Error handling like:', error);
        }
    };

    // Load initial data with user-specific keys
    const loadInitialData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const videoKey = getYoutubeVideoId();
            if (!videoKey) return;

            const { likes: likesKey, saves: savesKey, playlists: playlistsKey, views: viewsKey } = getUserStorageKeys();

            // Load all data in parallel with user-specific keys
            const [storedLikes, savedMedia, playlistsData, storedViews] = await Promise.all([
                AsyncStorage.getItem(likesKey),
                AsyncStorage.getItem(savesKey),
                AsyncStorage.getItem(playlistsKey),
                AsyncStorage.getItem(viewsKey)
            ]);

            const likedVideos = storedLikes ? JSON.parse(storedLikes) : {};
            const savedVideos = savedMedia ? JSON.parse(savedMedia) : {};
            const userPlaylists = playlistsData ? JSON.parse(playlistsData) : {};
            const viewsData = storedViews ? JSON.parse(storedViews) : {};

            setIsLiked(!!likedVideos[videoKey]);
            setIsSaved(!!savedVideos[videoKey]);
            setLikeCount(media.likes || 0);
            setViewCount(viewsData[videoKey] || 0);

            const sortedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            setPlaylists(sortedPlaylists);
            setCurrentPlaylists(sortedPlaylists);

            await updateViewCount();
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [media.id, media.likes, updateViewCount, user]);

    // Save to playlist with user-specific key
    const saveToPlaylist = async (playlistId) => {
        if (!checkUserAuth()) return;

        try {
            const { playlists: playlistKey } = getUserStorageKeys();
            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                showToast('Error: Invalid video');
                return;
            }

            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);


            if (!userPlaylists[playlistId]) {
                showToast('Playlist not found');
                return;
            }

            // Check if the video is already in the playlist
            const videoExists = userPlaylists[playlistId].videos.some(v => v.videoId === videoKey);
            if (videoExists) {
                userPlaylists[playlistId].videos = userPlaylists[playlistId].videos.filter(v => v.videoId !== videoKey);
                showToast('Video already in playlist');
                return;
            } else {
                // Add video if it is not in the playlist
                userPlaylists[playlistId].videos.push({
                    videoId: videoKey,
                    title: media.title || '',
                    thumbnailUrl: media.thumbnail || '',
                    added_at: new Date().toISOString()
                });
                showToast('Video saved to playlist');
            }

            // ... rest of the save logic
            await AsyncStorage.setItem(playlistKey, JSON.stringify(userPlaylists));

            // Update the local state
            const sortedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            setPlaylists(sortedPlaylists);
            setCurrentPlaylists(sortedPlaylists);

            // Update saved state
            const videoExistsInAnyPlaylist = Object.values(userPlaylists).some(
                playlist => playlist.videos.some(v => v.videoId === videoKey)
            );

            setIsSaved(videoExistsInAnyPlaylist);

            showToast('Video saved to playlist');
        } catch (error) {
            console.error('Error saving to playlist:', error);
            showToast('Error saving video');
        }
    };

    // Add useEffect to clear data on user logout
    useEffect(() => {
        if (!user) {
            // Clear all states when user logs out
            setIsLiked(false);
            setIsSaved(false);
            setLikeCount(0);
            setViewCount(0);
            setPlaylists([]);
            setCurrentPlaylists([]);
            // Close any open modals
            setSaveModalVisible(false);
            setShowPlaylistViewer(false);
            setShowPlaylistDetails(false)
        } else {
            // Load user-specific data when logged in
            const initializeData = async () => {
                try {
                    await Promise.all([
                        loadInitialData(),
                        loadPlaylists(),
                        checkVideoInPlaylists()]);
                } catch (error) {
                    console.error('Error initializing data:', error);
                }
            };
            initializeData();
        }
    }, [user, loadInitialData, loadPlaylists, checkVideoInPlaylists]);

    // Add a function to check if video is in any playlist
    const checkVideoInPlaylists = useCallback(async () => {
        if (!user) return;

        try {
            const { playlists: playlistKey } = getUserStorageKeys();
            const videoKey = getYoutubeVideoId();

            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            const videoExistsInAnyPlaylist = Object.values(userPlaylists).some(
                playlist => playlist.videos?.some(v => v.videoId === videoKey)
            );

            setIsSaved(videoExistsInAnyPlaylist);
        } catch (error) {
            console.error('Error checking video in playlists:', error);
        }
    }, [user, getUserStorageKeys, getYoutubeVideoId]);

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

    const handleSave = useCallback(() => {
        if (!checkUserAuth()) return;

        if (showPlaylistViewer) {
            setShowPlaylistViewer(false);
        }
        setSaveModalVisible(true);
    }, [showPlaylistViewer, checkUserAuth]);


    /* A. Handle Save */
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

    // Main component handlers
    const handleSaveModalClose = useCallback(() => {
        setSaveModalVisible(false);
        setShowNewPlaylistInput(false);
        setInputKey(prev => prev + 1);
    }, []);

    /**********************/
    /* B. Handle Playlist */
    /**********************/
    const handlePlaylistViewerClose = useCallback(() => {
        setShowPlaylistViewer(false);
        setShowPlaylistDetails(false);
        setSelectedPlaylist(null);
    }, []);

    const handleShowPlaylistDetails = useCallback((playlist) => {
        setSelectedPlaylist(playlist);
        setShowPlaylistDetails(true);
    }, []);

    const handleHidePlaylistDetails = useCallback(() => {
        setShowPlaylistDetails(false);
        setSelectedPlaylist(null);
    }, []);

    const handlePlaylistViewerOpen = useCallback(() => {
        if (saveModalVisible) {
            setSaveModalVisible(false);
        }
        setShowPlaylistViewer(true);
    }, [saveModalVisible]);

    const handleCreateNewPlaylist = useCallback(async (playlistName) => {
        if (!user) return;

        try {
            if (!playlistName.trim()) {
                showToast('Please enter a playlist name');
                return;
            }

            const videoKey = getYoutubeVideoId();
            if (!videoKey) {
                showToast('Error getting video key');
                return;
            }

            const { playlists: playlistKey } = getUserStorageKeys();
            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            // Check for duplicate playlist name
            if (Object.values(userPlaylists).some(playlist => playlist.name === playlistName)) {
                showToast('Playlist name already exists');
                return;
            }

            // Create new playlist
            const newPlaylist = {
                id: Date.now().toString(),
                name: playlistName,
                videos: [{
                    videoId: videoKey,
                    title: media.title || '',
                    thumbnailUrl: media.thumbnail || '',
                    added_at: new Date().toISOString()
                }],
                created_at: new Date().toISOString()
            };

            userPlaylists[newPlaylist.id] = newPlaylist;
            await AsyncStorage.setItem(playlistKey, JSON.stringify(userPlaylists));

            // Update state immediately
            setPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
            setCurrentPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
            setIsSaved(true);

            // Reset UI states
            setShowNewPlaylistInput(false);
            setNewPlaylistName('');
            showToast('Playlist created and video saved');

            // Close the save modal after creating playlist
            setSaveModalVisible(false);
        } catch (error) {
            console.error('Error creating playlist:', error);
            showToast('Error creating playlist');
        }
    }, [media, getYoutubeVideoId, showToast, user, getUserStorageKeys, playlists]);

    const handleCancelInput = useCallback(() => {
        setShowNewPlaylistInput(false);
        setNewPlaylistName('');
    }, []);


    // handle delete video from playlist
    const handleDeleteVideoPlaylist = async (playlistId, videoId) => {
        if (!checkUserAuth()) return;
        try {
            // Get current playlists from storage
            const { playlists: playlistKey } = getUserStorageKeys();
            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);


            if (!userPlaylists[playlistId]) {
                showToast('Playlist not found');
                return;
            }

            // Check if playlist has videos array
            if (!Array.isArray(userPlaylists[playlistId].videos)) {
                userPlaylists[playlistId].videos = [];
                showToast('Playlist does not have a valid videos array');
                return;
            }
            // remove video from playlist
            userPlaylists[playlistId].videos = userPlaylists[playlistId].videos.filter(v => v.videoId !== videoId);

            // Update playlists in storage
            await AsyncStorage.setItem(playlistKey, JSON.stringify(userPlaylists));

            // Immediately update the local state
            setPlaylists(prevPlaylists =>
                prevPlaylists.map(playlist =>
                    playlist.id === playlistId ? { ...playlist, videos: playlist.videos.filter(v => v.videoId !== videoId) } : playlist
                )
            );

            setCurrentPlaylists(prevPlaylists =>
                prevPlaylists.map(playlist =>
                    playlist.id === playlistId ? { ...playlist, videos: playlist.videos.filter(v => v.videoId !== videoId) } : playlist
                )
            );

            // Update selected playlist if it's the one being modified
            if (selectedPlaylist?.id === playlistId) {
                setSelectedPlaylist(prevPlaylist => ({
                    ...prevPlaylist,
                    videos: prevPlaylist.videos.filter(v => v.videoId !== videoId)
                }));
            }

            //check if the current video exists in any playlist
            const videoExistsInAnyPlaylist = Object.values(userPlaylists).some(
                playlist => playlist.videos.some(v => v.videoId === videoId)
            );

            setIsSaved(videoExistsInAnyPlaylist);
            showToast('Video removed from playlist');

        } catch (error) {
            console.error('Error deleting video:', error);
            showToast('Error deleting video');
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!user) return;

        try {
            const { playlists: playlistKey } = getUserStorageKeys();
            const storedPlaylists = await AsyncStorage.getItem(playlistKey) || '{}';
            const userPlaylists = JSON.parse(storedPlaylists);

            if (!userPlaylists[playlistId]) {
                showToast('Playlist not found');
                return;
            }

            // Delete playlist from storage
            delete userPlaylists[playlistId];

            // Update storage
            await AsyncStorage.setItem(playlistKey, JSON.stringify(userPlaylists));

            // Immediately update both state arrays with the filtered playlists
            const updatedPlaylists = Object.values(userPlaylists)
                .filter(playlist => playlist && playlist.videos)
                .sort((a, b) => b.created_at.localeCompare(a.created_at));

            setPlaylists(updatedPlaylists);
            setCurrentPlaylists(updatedPlaylists);

            // If the deleted playlist was selected, clear the selected playlist
            if (selectedPlaylist?.id === playlistId) {
                setSelectedPlaylist(null);
                setShowPlaylistDetails(false);
            }

            // Check if the current video exists in any remaining playlists
            const videoKey = getYoutubeVideoId();
            const videoExistsInPlaylists = Object.values(userPlaylists).some(playlist =>
                playlist.videos?.some(v => v.videoId === videoKey)
            );
            setIsSaved(videoExistsInPlaylists);

            showToast('Playlist deleted');

            // Close all relevant modals
            setSaveModalVisible(false);
            setShowPlaylistViewer(false);
            setShowPlaylistDetails(false);

        } catch (error) {
            console.error('Error deleting playlist:', error);
            showToast('Error deleting playlist');

            // Reload playlists in case of error
            try {
                const reloadedPlaylists = await loadPlaylists();
                setPlaylists(reloadedPlaylists);
                setCurrentPlaylists(reloadedPlaylists);
            } catch (reloadError) {
                console.error('Error reloading playlists:', reloadError);
            }
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


    // Playlist Details Modal
    const PlaylistDetailsModal = memo(({ playlist, visible, onDismiss }) => {
        const handleClose = useCallback(() => {
            onDismiss();
        }, [onDismiss]);

        const renderThumbnail = (video) => {
            if (!video.thumbnailUrl) {
                return (
                    <View style={[styles.thumbnailContainer, styles.placeholderThumbnail]}>
                        <MaterialIcons name="ondemand-video" size={24} color="#666" />
                    </View>
                );
            }
            return (<View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: video.thumbnailUrl }}
                    style={styles.videoThumbnail}
                    resizeMode="cover"
                />
            </View>);
        };

        if (!visible || !playlist) return null;

        // Render Playlist Details Modal
        return (
            <Portal>
                <Dialog
                    visible={true}
                    onDismiss={handleClose}
                    style={styles.playlistDetailsDialog}
                    dismissable={true}
                >
                    <Dialog.Title>{playlist.name}</Dialog.Title>
                    <Dialog.ScrollArea style={styles.dialogScrollArea}>
                        <ScrollView>
                            {playlist.videos.length === 0 ? (
                                <List.Item
                                    title="No videos in playlist"
                                    description="Save some videos to see them here"
                                    left={props => <List.Icon {...props} icon="playlist-remove" />}
                                />
                            ) : (
                                playlist.videos.map((video, index) => (
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
                                                                onPress: () => handleDeleteVideoPlaylist(playlist.id, video.videoId),
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
                        <Button onPress={handleClose}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    });

    // Move SaveModal outside of the main component
    const SaveModal = memo(({ visible, onClose, videoKey }) => {
        const handleClose = useCallback(() => {
            onClose();
        }, [onClose]);

        if (!visible) return null;

        return (
            <Portal>
                <Dialog
                    visible={true}
                    onDismiss={handleClose}
                    style={styles.saveDialog}
                    dismissable={true}
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
                    <Dialog.Actions>
                        <Button onPress={handleClose}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        );
    });

    // Move PlaylistViewer outside and make it a memo component
    const PlaylistViewer = memo(({
        visible,
        onClose,
        playlists,
        showDetails,
        selectedPlaylist,
        onShowDetails,
        onHideDetails
    }) => {
        const handleClose = useCallback(() => {
            onClose();
        }, [onClose]);

        const handlePlaylistSelect = useCallback((playlist) => {
            onShowDetails(playlist);
        }, [onShowDetails]);

        if (!visible) return null;

        return (
            <Portal>
                <Dialog
                    visible={true}
                    onDismiss={handleClose}
                    style={styles.playlistDialog}
                    dismissable={true}
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
                                                    onPress={() => handlePlaylistSelect(playlist)}
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
                                        onPress={() => handlePlaylistSelect(playlist)}
                                        style={styles.playlistItem}
                                    />
                                ))
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={handleClose}>Close</Button>
                    </Dialog.Actions>
                </Dialog>

                <PlaylistDetailsModal
                    playlist={selectedPlaylist}
                    visible={showDetails}
                    onDismiss={onHideDetails}
                />
            </Portal>
        );
    });

    console.log('selectedPlaylist', selectedPlaylist);
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
                                onPress={handlePlaylistViewerOpen}
                                style={styles.actionButton}
                            >
                                Playlists
                            </Button>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <SaveModal
                visible={saveModalVisible}
                onClose={handleSaveModalClose}
                videoKey={getYoutubeVideoId()}
            />
            <PlaylistViewer
                visible={showPlaylistViewer}
                onClose={handlePlaylistViewerClose}
                playlists={currentPlaylists}
                showDetails={showPlaylistDetails}
                selectedPlaylist={selectedPlaylist}
                onShowDetails={handleShowPlaylistDetails}
                onHideDetails={handleHidePlaylistDetails}
            />
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
    likedButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    savedButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
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

export default MediaDetailsUser;