import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './equipmentStatus.css';

const EquipmentStatus = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const response = await axios.get('/api/equipment');
                setEquipment(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEquipment();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="equipment-status">
            <h2>Equipment Status</h2>
            <ul>
                {equipment.map((item) => (
                    <li key={item.equipment_id}>
                        <p>{item.equipment_name} - {item.status}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EquipmentStatus;