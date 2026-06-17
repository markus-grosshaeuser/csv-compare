import { describe, expect, it } from 'vitest'
import csvHeaderReducer, {
    setTargetHeader,
    setSourceHeader,
} from '../../src/redux/csvHeaderSlice'

describe('File: csvHeaderSlice.ts', () => {
    it('should return the initial state', () => {
        expect(csvHeaderReducer(undefined, { type: 'unknown' })).toEqual({
            value: {
                sourceHeader: [],
                targetHeader: [],
            },
        })
    })

    it('should set the source header', () => {
        const state = csvHeaderReducer(
            undefined,
            setSourceHeader(['id', 'name', 'email']),
        )

        expect(state.value.sourceHeader).toEqual(['id', 'name', 'email'])
        expect(state.value.targetHeader).toEqual([])
    })

    it('should set the destination header', () => {
        const state = csvHeaderReducer(
            undefined,
            setTargetHeader(['employee_id', 'full_name', 'mail']),
        )

        expect(state.value.targetHeader).toEqual([
            'employee_id',
            'full_name',
            'mail',
        ])
        expect(state.value.sourceHeader).toEqual([])
    })

    it('should replace source and target headers independently', () => {
        const initialState = {
            value: {
                sourceHeader: ['old_id', 'old_name'],
                targetHeader: ['old_employee_id', 'old_full_name'],
            },
        }

        const withNewSourceHeader = csvHeaderReducer(
            initialState,
            setSourceHeader(['id', 'name', 'email']),
        )

        const withNewTargetHeader = csvHeaderReducer(
            withNewSourceHeader,
            setTargetHeader(['employee_id', 'full_name', 'mail']),
        )

        expect(withNewTargetHeader.value).toEqual({
            sourceHeader: ['id', 'name', 'email'],
            targetHeader: ['employee_id', 'full_name', 'mail'],
        })
    })
})
