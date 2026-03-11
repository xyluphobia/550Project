import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './equipmentBooking.css';

const EquipmentBooking = () => {
    const [equipmentList, setEquipmentList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        // Fetch equipment data from the backend
        axios.get('/api/equipment')
            .then(response => {
                setEquipmentList(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching equipment data:', error);
                setError(error);
                setLoading(false);
            });
    }, []);

    if (error) {
        return <p>Error loading equipment: {error.message}</p>;
    }

     if (loading) {
        return <p>Loading equipment...{error ? `Error: ${error.message}` : ''}</p>;
    }

    return (
        <div className="equipment-booking-page">
            <p>All equipment is located in the library.</p>
            <ul>
                {equipmentList.map((item) => (
                    <li key={item.id}>{item.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default EquipmentBooking;