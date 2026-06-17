import { Route, Routes } from 'react-router-dom'
import DataSourceScreen from './pages/DataSourceScreen.tsx'
import DataSynchronizationScreen from './pages/DataSynchronizationScreen.tsx'
import './App.css'
import DataEvaluationScreen from './pages/DataEvaluationScreen.tsx'
import { useEffect } from 'react'
import type { FileState } from './redux/fileSlice.ts'
import { useSelector } from 'react-redux'
import type { RootState } from './redux/store.ts'

export default function App() {
    const inputFiles: FileState = useSelector(
        (state: RootState) => state.file.value,
    )

    useEffect(() => {
        window.addEventListener('beforeunload', () => {
            URL.revokeObjectURL(inputFiles.source.objectUrl)
            URL.revokeObjectURL(inputFiles.target.objectUrl)
        })
    })

    return (
        <div className="app">
            <h1>CSV Compare</h1>
            <Routes>
                <Route path="/" element={<DataSourceScreen />} />
                <Route path="/sync" element={<DataSynchronizationScreen />} />
                <Route path="/evaluation" element={<DataEvaluationScreen />} />
            </Routes>
        </div>
    )
}
