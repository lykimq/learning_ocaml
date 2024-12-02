import { Alert, Platform } from 'react-native';

export const PLATFORM_WEB = 'web';
export const PLATFORM_IOS = 'ios';
export const PLATFORM_ANDROID = 'android';

// Cross-platform alert function
export const showAlert = (title, message, onOk, setDialogMessage, setDialogVisible, setDialogCallback) => {
    if (Platform.OS === PLATFORM_WEB) {
        setDialogMessage({ title, message });
        setDialogVisible(true);
        if (onOk) {
            setDialogCallback(() => onOk);
        }
    } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
};

export const onDateChange = (event, selectedDate, eventDate, setShowDatePicker, setEventDate) => {
    const currentDate = selectedDate || eventDate;
    setShowDatePicker(Platform.OS === PLATFORM_IOS);
    setEventDate(currentDate);
};

export const onTimeChange = (event, selectedTime, eventTime, setShowTimePicker, setEventTime) => {
    const currentTime = selectedTime || eventTime;
    setShowTimePicker(Platform.OS === PLATFORM_IOS);
    setEventTime(currentTime);
};