import { describe, expect, it } from 'vitest'
import templateReducer, { setTemplate } from '../../src/redux/templateSlice'

describe('File: templateSlice.ts', () => {
    it('should return the initial state', () => {
        expect(templateReducer(undefined, { type: 'unknown' })).toEqual({
            value: {
                primary_key: [],
                column_match: [],
            },
        })
    })

    it('should set the template', () => {
        const template = {
            primary_key: [
                {
                    source: 'id',
                    target: 'employee_id',
                },
            ],
            column_match: [
                {
                    source: 'id',
                    target: 'employee_id',
                },
                {
                    source: 'email',
                    target: 'mail',
                },
            ],
        }

        const state = templateReducer(undefined, setTemplate(template))

        expect(state.value).toEqual(template)
    })

    it('should replace an existing template', () => {
        const initialState = {
            value: {
                primary_key: [
                    {
                        source: 'old_id',
                        target: 'old_employee_id',
                    },
                ],
                column_match: [
                    {
                        source: 'old_email',
                        target: 'old_mail',
                    },
                ],
            },
        }

        const nextTemplate = {
            primary_key: [
                {
                    source: 'new_id',
                    target: 'new_employee_id',
                },
            ],
            column_match: [
                {
                    source: 'new_email',
                    target: 'new_mail',
                },
            ],
        }

        const state = templateReducer(initialState, setTemplate(nextTemplate))

        expect(state.value).toEqual(nextTemplate)
    })
})
