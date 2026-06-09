import { configureStore } from '@reduxjs/toolkit'
import FileReducer from './fileSlice.ts'

const store = configureStore({
    reducer: {
        file: FileReducer,
    },
})

export type FileDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export default store
