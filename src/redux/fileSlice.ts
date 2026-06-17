import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FileEntry = {
    name: string
    objectUrl: string
}

export type FileState = {
    source: FileEntry
    target: FileEntry
}

const fileState: FileState = {
    source: { name: '', objectUrl: '' },
    target: { name: '', objectUrl: '' },
}

export const fileSlice = createSlice({
    name: 'file',
    initialState: {
        value: fileState,
    },
    reducers: {
        setSourceFile: (
            state: { value: FileState },
            action: PayloadAction<FileEntry>,
        ) => {
            state.value.source.name = action.payload.name
            state.value.source.objectUrl = action.payload.objectUrl
        },
        setTargetFile: (
            state: { value: FileState },
            action: PayloadAction<FileEntry>,
        ) => {
            state.value.target.name = action.payload.name
            state.value.target.objectUrl = action.payload.objectUrl
        },
    },
})

export const { setSourceFile, setTargetFile } = fileSlice.actions
export default fileSlice.reducer
