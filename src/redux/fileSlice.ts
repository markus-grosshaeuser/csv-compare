import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FileEntry = {
    name: string
    objectUrl: string
}

export type FileState = {
    source: FileEntry
    destination: FileEntry
}

const fileState: FileState = {
    source: { name: '', objectUrl: '' },
    destination: { name: '', objectUrl: '' },
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
        setDestinationFile: (
            state: { value: FileState },
            action: PayloadAction<FileEntry>,
        ) => {
            state.value.destination.name = action.payload.name
            state.value.destination.objectUrl = action.payload.objectUrl
        },
    },
})

export const { setSourceFile, setDestinationFile } = fileSlice.actions
export default fileSlice.reducer
