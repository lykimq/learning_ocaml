import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Alert } from "react-native";
import { addEvent, getEvents } from "../../../services/eventService";
import EventForm from "../../admin/events/EventForm";

const EventsList = () => {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchEvents();
    }, [])

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const eventsList = await getEvents();
            setEvents(eventsList)
        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEventSubmit = async (formData) => {
        try {
            await addEvent(formData)
        } catch (error) {
            console.error('Error adding event:', error)
            Alert.loading('Error', 'There was an issue adding the event. Please try again.')
        }
    }

    return (
        <View>
            <EventForm onSubmit={handleEventSubmit} />
             {loading ? (<Text> Loading events ... </Text>) :(
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View>
                <Text>{item.event_title}</Text>
                {/* Render other event details here */}
              </View>
            )}
          />)}
        </View>
      );

}

export default EventsList