import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import RoomBookingCalendar from './components/roomBookingCalendar/roomBookingCalendar';
import EquipmentBooking from './components/equipmentBooking/equipmentBooking';

function Home() {
    return (
        <div className="App">
            <header>
                <div className='image-container'> 
                    <img src="../src/images/UNCWLibraryImage.jpg" alt="UNCW Library" />    
                </div>
            </header>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/equipment">Equipment</Link></li>
                </ul>
            </nav>
            <main>
                <aside>
                    <h3>Welcome to CSC-550 Booking System</h3>
                    <p>Book rooms and equipment for our project.</p>
                </aside>
                <section>
                    <hr />
                    <div><RoomBookingCalendar /></div>
                </section>
            </main>
            
            <footer>
                <p>&copy; 2026 - CSC550 Software Engineering</p>
                <p>Contact us at ____@</p>
            </footer>
        </div>
    );
}

function EquipmentPage() {
    return (
        <div className="equipment-page">
            <header>
                <div className='image-container'> 
                    <img src="../src/images/UNCWLibraryImage.jpg" alt="UNCW Library" />    
                </div>
            </header>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/equipment">Equipment</Link></li>
                </ul>
            </nav>
            <main>
                <h3>Available Equipment</h3>
                <hr />
                <p>Available library Equipment including laptops, and specialized computers</p>
                <section>
                    <div><EquipmentBooking /></div>
                </section>
                
            </main>
            <footer>
                <p>&copy; 2026 - CSC550 Software Engineering</p>
                <p>Contact us at ____@</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/equipment" element={<EquipmentPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
