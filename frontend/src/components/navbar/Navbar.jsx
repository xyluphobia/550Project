import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ adminSession, onLogin, onLogout }) => {
    const location = useLocation();

    return (
        <nav className='main-nav'>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/equipment">Equipment</Link></li>
                <li><Link to="/my-reservations">My Reservations</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;