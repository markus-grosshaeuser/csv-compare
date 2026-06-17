import { configureStore } from '@reduxjs/toolkit'
import FileReducer from './fileSlice.ts'
import TemplateReducer from './templateSlice.ts'
import csvHeaderReducer from './csvHeaderSlice.ts'

const store = configureStore({
    reducer: {
        file: FileReducer,
        template: TemplateReducer,
        csvHeader: csvHeaderReducer,
    },
})

export type FileDispatch = typeof store.dispatch
export type TemplateDispatch = typeof store.dispatch
export type CsvHeaderDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>

export default store
