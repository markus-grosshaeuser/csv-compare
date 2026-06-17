import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MatchingColumnsTuple } from '../utilities/CsvUtility.ts'

export type Template = {
    primary_key: MatchingColumnsTuple[]
    column_match: MatchingColumnsTuple[]
}

const templateState: Template = {
    primary_key: [],
    column_match: [],
}

export const templateSlice = createSlice({
    name: 'file',
    initialState: {
        value: templateState,
    },
    reducers: {
        setTemplate: (
            state: { value: Template },
            action: PayloadAction<Template>,
        ) => {
            state.value.primary_key = action.payload.primary_key
            state.value.column_match = action.payload.column_match
        },
    },
})

export const { setTemplate } = templateSlice.actions
export default templateSlice.reducer
