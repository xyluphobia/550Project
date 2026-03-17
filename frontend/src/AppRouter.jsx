import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './App';
import EquipmentPage from './EquipmentPage';

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/equipment" element={<EquipmentPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;