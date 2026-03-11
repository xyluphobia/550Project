import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './equipmentBooking.css';

const EquipmentBooking = () => {
    const [equipmentList, setEquipmentList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const backupArray = [
        { id: 'laptop', name: 'laptop-1'},
        { id: 'laptop', name: 'laptop-2'},
        { id: 'laptop', name: 'laptop-3'},
        { id: 'laptop', name: 'laptop-4'},
        { id: 'Desktop', name: 'Desktop-1'},
        { id: 'Desktop', name: 'Desktop-2'},
        { id: 'Desktop', name: 'Desktop-3'},
        { id: 'Desktop', name: 'Desktop-4'},
    ];

    const backupList = backupArray.map((item) =>
        <li key={item.id}>{item.name}</li>
    );

    React.useEffect(() => {
        // Fetch equipment data from the backend
        axios.get('/api/equipment')
            .then(response => {
                // Ensure response.data is an array
                if (Array.isArray(response.data)) {
                    setEquipmentList(response.data);
                } else {
                    console.error('Expected array but got:', typeof response.data);
                    setEquipmentList(backupList);
                    setError(new Error('Invalid data format received from server'));
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching equipment data:', error);
                
                // Handle different error types
                if (error.code === 'ERR_NETWORK') {
                    setError(new Error('Network error - please check if the server is running'));
                } else {
                    setError(error);
                }
                
                setEquipmentList(backupList); // Reset to backup array on error
                setLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">Error loading equipment: {error.message}</p>
                <div>{backupList}</div>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    if (loading) {
        return <p>Loading equipment...</p>;
    }

    // Safety check - ensure equipmentList is an array before rendering
    const equipmentArray = Array.isArray(equipmentList) ? equipmentList : [];

    return (
        <div className="equipment-booking-page">
            <p>All equipment is located in the library.</p>
            
            {equipmentArray.length === 0 ? (
                <p>No equipment available at the moment.</p>
            ) : (
                <ul>
                    {equipmentArray.map((item, index) => (
                        <li key={item.id || index}>
                            {item.name || 'Unnamed Equipment'}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default EquipmentBooking;