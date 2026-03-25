import { useEffect, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import { BOOKING_TEMPLATE_ID, EQUIPMENT_TEMPLATE_ID, SERVICE_ID, PUBLIC_KEY } from './emailConfig';

const EmailJSConfigBooking = ({ events, rooms, buildings, loading, error }) => {
    // EmailJS integration for sending booking confirmation emails
    const sendConfirmationEmail = useCallback((booking) => {
        const emailParams = {
            to_name: booking.userName,
            to_email: booking.userEmail,
            event_title: booking.title,
            event_time: `${new Date(booking.start).toLocaleString()} - ${new Date(booking.end).toLocaleString()}`,
            room_name: rooms.find(r => r.id === booking.room)?.name || '',
            building_name: buildings.find(b => b.id === booking.building)?.name || '',
            description: booking.description || 'No description provided.'
        };

        emailjs.send(SERVICE_ID, BOOKING_TEMPLATE_ID, emailParams, PUBLIC_KEY)
            .then((response) => {
                console.log('Email sent successfully!', response.status, response.text);
            })
            .catch((err) => {
                console.error('Failed to send email:', err);
            });
    }, [rooms, buildings]);

    useEffect(() => {
        // Send confirmation email when a new booking is added
        if (events.length > 0) {
            const latestBooking = events[events.length - 1];
            sendConfirmationEmail(latestBooking);
        }
    }, [events, rooms, buildings, sendConfirmationEmail]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return null;
};

const EmailJSConfigEquipment = ({ item, loading, error }) => {
    useEffect(() => {
        if (item) {
            const emailParams = {
                message: 'Equipment booking update',
                item_name: item.name || 'Unnamed Equipment',
            };

            emailjs.send(SERVICE_ID, EQUIPMENT_TEMPLATE_ID, emailParams, PUBLIC_KEY)
                .then((response) => {
                    console.log('Email sent successfully!', response.status, response.text);
                })
                .catch((err) => {
                    console.error('Failed to send email:', err);
                });
        }
    }, [item]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return null;
};

export { EmailJSConfigBooking, EmailJSConfigEquipment };