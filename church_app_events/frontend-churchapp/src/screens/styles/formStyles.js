import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#4A90E2',     // Primary blue
    primaryBlue: '#3f51b5',
    lightBlue: '#4A90E2',   // Light blue
    buttonText: '#fff', // White button text
    background: '#f5f5f5',     // Light gray background
    inputBackground: '#f7f7f7', // Light gray input background
    text: '#333',          // Dark text
    border: '#6200ee',     // Light gray border
    error: '#c62828',      // Red error color
    errorBackground: '#ffebee', // Light red background for error messages
    errorBorder: '#ffcdd2',   // Light red border for error messages
    required: '#ff0000',           // Required label
    shadow: '#000',        // Shadow color

};

const LAYOUT = {
    padding: 20,
    borderRadius: 8,
    maxWidth: 600,
};


const TYPOGRAPHY = {
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#000',
    },
    button: {
        fontSize: 16,
    },
};

const formStyles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        width: '100%',
        padding: LAYOUT.padding,
        backgroundColor: COLORS.background,
        alignSelf: 'center',
        ...(Platform.OS === 'web'
            ? {
                maxWidth: Math.min(LAYOUT.maxWidth, width * 0.9),
                marginHorizontal: 'auto',
                marginVertical: 20,
                borderRadius: LAYOUT.borderRadius,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }
            : {
                flex: 1,
            }
        ),
    },
    title: {
        ...TYPOGRAPHY.title,
        marginBottom: LAYOUT.padding,
        textAlign: 'center',
        color: COLORS.primaryBlue,
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        marginBottom: 8,
    },
    labelText: {
        fontSize: 16,
        color: COLORS.text
    },
    required: {
        color: COLORS.required,
    },
    submitButton: {
        marginTop: LAYOUT.padding,
        paddingVertical: 8,
        backgroundColor: COLORS.lightBlue,
        color: COLORS.buttonText,
        alignSelf: 'stretch',
    },
    errorContainer: {
        padding: 10,
        backgroundColor: COLORS.errorBackground,
        borderColor: COLORS.errorBorder,
        borderWidth: 1,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: 15,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
    },
    // Additional style from EventForm.js
    keyboardAvoidingView: {
        flex: 1,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    dateTimeLabel: {
        ...TYPOGRAPHY.label,
        marginRight: 8,
        marginRight: 4,
        color: COLORS.text,
        width: 50
    },
    dateTimeButton: {
        flex: 1,
        borderRadius: 8,
        borderColor: COLORS.border,
    },
    webDateTimeInput: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: TYPOGRAPHY.label.fontSize,
    },
    textArea: {
        height: 100,
    },
    scrollView: {
        flexGrow: 1,
        width: '100%',
    },
    scrollViewContainer: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: LAYOUT.padding,
    },
    webContainer: {
        width: '100%',
        maxWidth: Math.min(LAYOUT.maxWidth, width * 0.9),
        marginHorizontal: 'auto',
    },
    dialogScrollContainer: {
        maxHeight: 400,
        padding: LAYOUT.padding,
    },
    videoSelectButton: {
        marginBottom: 8,
        marginHorizontal: 10,
        marginVertical: 5,
    },
    videoSelectButtonText: {
        fontSize: 16,
        color: COLORS.text,
    },

});


export default formStyles;