import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './reservationStatus.css';

const ReservationStatus = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await axios.get('/api/bookings');
        setReservations(response.data);
      } catch (err) {
        setError('Failed to fetch reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className='reservation-box'>
      <h2>Reservations</h2>
      <p>Your received email will have the Booking id to look for your reservation.</p>
      {reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <ul className='reservation-ul'>
          {reservations.map(reservation => (
            <li key={reservation.id}>
              <p>Reservation: {reservation.booking_id} - Room: {reservation.room_id} - {reservation.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReservationStatus;
