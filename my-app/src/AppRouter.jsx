import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './App';
import EquipmentPage from './EquipmentPage';
import LoginPage from './LoginPage';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;