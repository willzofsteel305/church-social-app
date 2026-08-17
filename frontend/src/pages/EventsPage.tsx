import React, { useEffect, useState } from 'react';
import { eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsApi.getAll();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, []);

  const handleRsvp = async (eventId: number) => {
    setMessage('');
    try {
      await eventsApi.rsvp(eventId);
      setMessage('RSVP saved successfully');
    } catch (_error) {
      setMessage('Unable to RSVP right now');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Church Events</h1>

      {message && <div className="mb-4 bg-blue-100 text-blue-700 p-3 rounded">{message}</div>}

      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-600 h-32" />
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <p className="text-sm text-gray-500 mb-2">📅 {event.date || event.event_date}</p>
                {event.location && <p className="text-sm text-gray-500 mb-4">📍 {event.location}</p>}
                <button
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  onClick={() => handleRsvp(event.id)}
                  disabled={!isAuthenticated}
                  type="button"
                >
                  {isAuthenticated ? 'RSVP Now' : 'Login to RSVP'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No events scheduled yet.</p>
      )}
    </div>
  );
};

export default EventsPage;
