import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './index.css';
import Navbar from './components/navbar/Navbar';
import RoomBookingCalendar from './components/roomBookingCalendar/roomBookingCalendar';
import EquipmentBooking from './components/equipmentBooking/equipmentBooking';
import AdminPanel from './components/adminPanel/adminPanel';
import ReservationStatus from './components/roomBookingCalendar/reservationStatus';

// ── Shared page shell ────────────────────────────────────────────────────────
function PageShell({ adminSession, onLogin, onLogout, children }) {
    return (
        <div className="App">
            <header>
                <div className="image-container">
                    <img src="../src/images/UNCWLibraryImage.jpg" alt="UNCW Library" />
                </div>
            </header>
            <Navbar adminSession={adminSession} onLogin={onLogin} onLogout={onLogout} />
            <main>
                {children}
            </main>
            <footer>
                <p>&copy; 2026 - CSC550 Software Engineering</p>
                <p>Contact us at uncwcoral@gmail.com</p>
            </footer>
        </div>
    );
}

// ── Pages ────────────────────────────────────────────────────────────────────
function Home({ adminSession, onLogin, onLogout }) {
    return (
        <PageShell adminSession={adminSession} onLogin={onLogin} onLogout={onLogout}>
            <aside>
                <h3>Welcome to CSC-550 Booking System</h3>
                <p>Book rooms and equipment here!</p>
            </aside>
            <section>
                <hr />
                <RoomBookingCalendar adminSession={adminSession} />
                <ReservationStatus/>
            </section>
        </PageShell>
    );
}

function EquipmentPage({ adminSession, onLogin, onLogout }) {
    return (
        <PageShell adminSession={adminSession} onLogin={onLogin} onLogout={onLogout}>
            <h3>Available Equipment</h3>
            <hr />
            <p>Available library equipment including laptops and specialised computers.</p>
            <section>
                <EquipmentBooking />
            </section>
        </PageShell>
    );
}

function AdminPage({ adminSession, onLogin, onLogout }) {
    const navigate = useNavigate();

    // If someone navigates directly to /admin without being logged in,
    // redirect them home.
    if (!adminSession) {
        navigate('/');
        return null;
    }

    return (
        <PageShell adminSession={adminSession} onLogin={onLogin} onLogout={onLogout}>
            <AdminPanel adminSession={adminSession} />
        </PageShell>
    );
}

// ── Root ─────────────────────────────────────────────────────────────────────
function App() {
    const [adminSession, setAdminSession] = useState(() => {
        const stored = localStorage.getItem('adminSession');
        return stored ? JSON.parse(stored) : null;
    });

    const handleLogin = (user) => {
        localStorage.setItem('adminSession', JSON.stringify(user));
        setAdminSession(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminSession');
        setAdminSession(null);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={
                    <Home adminSession={adminSession} onLogin={handleLogin} onLogout={handleLogout} />
                } />
                <Route path="/equipment" element={
                    <EquipmentPage adminSession={adminSession} onLogin={handleLogin} onLogout={handleLogout} />
                } />
                <Route path="/admin" element={
                    <AdminPage adminSession={adminSession} onLogin={handleLogin} onLogout={handleLogout} />
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
