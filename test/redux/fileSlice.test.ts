import { describe, expect, it } from 'vitest'
import fileReducer, {
    setTargetFile,
    setSourceFile,
} from '../../src/redux/fileSlice'

describe('File: fileSlice.ts', () => {
    it('should return the initial state', () => {
        expect(fileReducer(undefined, { type: 'unknown' })).toEqual({
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
        })
    })

    it('should set the source file', () => {
        const state = fileReducer(
            undefined,
            setSourceFile({
                name: 'source.csv',
                objectUrl: 'blob:source',
            }),
        )

        expect(state.value.source).toEqual({
            name: 'source.csv',
            objectUrl: 'blob:source',
        })
        expect(state.value.target).toEqual({
            name: '',
            objectUrl: '',
        })
    })

    it('should set the target file', () => {
        const state = fileReducer(
            undefined,
            setTargetFile({
                name: 'target.csv',
                objectUrl: 'blob:target',
            }),
        )

        expect(state.value.target).toEqual({
            name: 'target.csv',
            objectUrl: 'blob:target',
        })
        expect(state.value.source).toEqual({
            name: '',
            objectUrl: '',
        })
    })

    it('should replace existing source and target files independently', () => {
        const initialState = {
            value: {
                source: {
                    name: 'old-source.csv',
                    objectUrl: 'blob:old-source',
                },
                target: {
                    name: 'old-target.csv',
                    objectUrl: 'blob:old-target',
                },
            },
        }

        const withNewSource = fileReducer(
            initialState,
            setSourceFile({
                name: 'new-source.csv',
                objectUrl: 'blob:new-source',
            }),
        )

        const withNewTarget = fileReducer(
            withNewSource,
            setTargetFile({
                name: 'new-target.csv',
                objectUrl: 'blob:new-target',
            }),
        )

        expect(withNewTarget.value).toEqual({
            source: {
                name: 'new-source.csv',
                objectUrl: 'blob:new-source',
            },
            target: {
                name: 'new-target.csv',
                objectUrl: 'blob:new-target',
            },
        })
    })
})
