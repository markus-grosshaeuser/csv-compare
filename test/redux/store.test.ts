import { describe, expect, it } from 'vitest'
import store from '../../src/redux/store'
import { setSourceFile } from '../../src/redux/fileSlice'
import { setTemplate } from '../../src/redux/templateSlice'
import { setSourceHeader } from '../../src/redux/csvHeaderSlice'

describe('File: store.ts', () => {
    it('should expose the expected reducer keys', () => {
        expect(store.getState()).toHaveProperty('file')
        expect(store.getState()).toHaveProperty('template')
        expect(store.getState()).toHaveProperty('csvHeader')
    })

    it('should contain the expected initial state', () => {
        expect(store.getState()).toMatchObject({
            file: {
                value: {
                    source: {
                        name: '',
                        objectUrl: '',
                    },
                    target: {
                        name: '',
                        objectUrl: '',
                    },
                },
            },
            template: {
                value: {
                    primary_key: [],
                    column_match: [],
                },
            },
            csvHeader: {
                value: {
                    sourceHeader: [],
                    targetHeader: [],
                },
            },
        })
    })

    it('should update state when known actions are dispatched', () => {
        store.dispatch(
            setSourceFile({
                name: 'source.csv',
                objectUrl: 'blob:source',
            }),
        )

        store.dispatch(
            setTemplate({
                primary_key: [
                    {
                        source: 'id',
                        target: 'employee_id',
                    },
                ],
                column_match: [
                    {
                        source: 'email',
                        target: 'mail',
                    },
                ],
            }),
        )

        store.dispatch(setSourceHeader(['id', 'email']))

        expect(store.getState().file.value.source).toEqual({
            name: 'source.csv',
            objectUrl: 'blob:source',
        })
        expect(store.getState().template.value).toEqual({
            primary_key: [
                {
                    source: 'id',
                    target: 'employee_id',
                },
            ],
            column_match: [
                {
                    source: 'email',
                    target: 'mail',
                },
            ],
        })
        expect(store.getState().csvHeader.value.sourceHeader).toEqual([
            'id',
            'email',
        ])
    })
})
