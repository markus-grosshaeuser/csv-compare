import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type HeaderState = {
    sourceHeader: string[]
    targetHeader: string[]
}
const headerState: HeaderState = {
    sourceHeader: [],
    targetHeader: [],
}

export const csvHeaderSlice = createSlice({
    name: 'csvHeader',
    initialState: {
        value: headerState,
    },
    reducers: {
        setSourceHeader: (
            state: { value: HeaderState },
            action: PayloadAction<string[]>,
        ) => {
            state.value.sourceHeader = action.payload
        },
        setTargetHeader: (
            state: { value: HeaderState },
            action: PayloadAction<string[]>,
        ) => {
            state.value.targetHeader = action.payload
        },
    },
})

export const { setSourceHeader, setTargetHeader } = csvHeaderSlice.actions
export default csvHeaderSlice.reducer
