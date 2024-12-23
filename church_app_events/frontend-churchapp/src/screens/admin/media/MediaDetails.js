import React, { useState } from 'react';
import { View, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Title, Paragraph, Card, Chip, IconButton, Avatar, Button, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const MediaDetails = ({ route }) => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { media } = route.params;
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Extract video ID from YouTube URL or use the provided ID
    const getYoutubeVideoId = () => {
        if (media.id?.videoId) return media.id.videoId;
        if (typeof media.id === 'string') return media.id;
        return '';
    };

    const videoId = getYoutubeVideoId();
    const embedHeight = Platform.OS === 'web' ? Math.min(width * 0.5625, 500) : width * 0.5625; // 16:9 aspect ratio

    const renderVideoPlayer = () => {
        if (media.source === 'youtube') {
            return (
                <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}>
                    <WebView
                        style={[styles.video, { height: embedHeight }]}
                        javaScriptEnabled={true}
                        source={{
                            uri: `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`
                        }}
                    />
                    {Platform.OS === 'web' && (
                        <IconButton
                            icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                            onPress={() => setIsFullscreen(!isFullscreen)}
                            style={styles.fullscreenButton}
                        />
                    )}
                </View>
            );
        }
        return null;
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
                                {media.views || '0'} views • {new Date(media.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <Button
                                icon="thumb-up"
                                mode="text"
                                onPress={() => { }}
                                style={styles.actionButton}
                            >
                                Like
                            </Button>
                            <Button
                                icon="share"
                                mode="text"
                                onPress={() => { }}
                                style={styles.actionButton}
                            >
                                Share
                            </Button>
                            <Button
                                icon="playlist-plus"
                                mode="text"
                                onPress={() => { }}
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
                            <Button mode="contained" style={styles.subscribeButton}>
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
});

export default MediaDetails;
