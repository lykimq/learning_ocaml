import React from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Share } from 'react-native';
import { Title, Text, Button } from 'react-native-paper';
import YoutubePlayer from 'react-native-youtube-iframe';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native';

const MediaDetailsNonLogin = ({ route, navigation }) => {
    console.log('MediaDetailsNonLogin Component Rendered');
    console.log('Route params:', route.params);
    console.log('Navigation:', navigation);

    const { width } = useWindowDimensions();
    const { media } = route.params;
    const embedHeight = width * 0.5625; // 16:9 aspect ratio

    const getYoutubeVideoId = () => {
        if (!media) return '';
        if (media.id?.videoId) return media.id.videoId;
        if (typeof media.id === 'string') return media.id;
        if (media.videoId) return media.videoId;
        return '';
    };

    const handleShare = async () => {
        try {
            const videoId = getYoutubeVideoId();
            await Share.share({
                message: `Check out this video: ${media.title}\nhttps://youtube.com/watch?v=${videoId}`,
            });
        } catch (error) {
            console.error('Error sharing media:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.videoContainer, { height: embedHeight }]}>
                <YoutubePlayer
                    height={embedHeight}
                    videoId={getYoutubeVideoId()}
                    play={false}
                    webViewProps={{
                        androidLayerType: Platform.OS === 'android' ? 'hardware' : undefined,
                    }}
                />
            </View>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Title style={styles.title}>
                        {media.title || media.snippet?.title}
                    </Title>
                    <View style={styles.metaContainer}>
                        <View style={styles.viewsDate}>
                            <MaterialIcons name="visibility" size={16} color="#666" />
                            <Text style={styles.metaText}>
                                {new Date(media.created_at || media.snippet?.publishedAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <Button
                                icon="share"
                                mode="text"
                                onPress={handleShare}
                                style={styles.actionButton}
                            >
                                Share
                            </Button>
                        </View>
                    </View>
                    <Text style={styles.description}>
                        {media.description || media.snippet?.description}
                    </Text>
                    <View style={styles.loginPrompt}>
                        <Text style={styles.loginText}>
                            Sign in to like videos, save to playlists, and more.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('Login')}
                            style={styles.loginButton}
                        >
                            Sign In
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    videoContainer: {
        width: '100%',
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    metaContainer: {
        marginVertical: 12,
    },
    viewsDate: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    metaText: {
        marginLeft: 8,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
        paddingVertical: 8,
    },
    actionButton: {
        marginHorizontal: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 12,
    },
    loginPrompt: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 12,
    },
    loginButton: {
        width: '100%',
        marginTop: 8,
    },
});

export default MediaDetailsNonLogin;
