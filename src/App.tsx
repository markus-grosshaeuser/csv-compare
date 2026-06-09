import { Route, Routes } from 'react-router-dom'
import DataSourceScreen from './pages/DataSourceScreen.tsx'
import DataSynchronizationScreen from './pages/DataSynchronizationScreen.tsx'
import './App.css'

export default function App() {
    return (
        <div className="app">
            <h1>CSV Compare</h1>
            <Routes>
                <Route path="/" element={<DataSourceScreen />} />
                <Route
                    path="/evaluation"
                    element={<DataSynchronizationScreen />}
                />
            </Routes>
        </div>
    )
}
