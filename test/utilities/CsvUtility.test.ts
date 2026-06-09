import { describe, expect, it } from 'vitest'

import {
    createNumericPkIndices,
    createReorderKey,
    applyReorderKeyToDataset,
    filterMaps,
} from '../../src/utilities/CsvUtility'

describe('File: CsvUtility', () => {
    describe('Function: createNumericPkIndices', () => {
        it('should return an array of numeric indices for primary key columns', () => {
            const pk = ['LastName', 'FirstName']
            const header = ['UserName', 'LastName', 'FirstName', 'PhoneNumber']
            expect(createNumericPkIndices(pk, header)).toEqual([1, 2])
        })

        it('should return an empty array when the provided primary key is empty', () => {
            const header = ['UserName', 'LastName', 'FirstName', 'PhoneNumber']
            expect(createNumericPkIndices([], header)).toEqual([])
        })

        it('should return an empty array when the provided header is empty', () => {
            const pk = ['LastName', 'FirstName']
            expect(createNumericPkIndices(pk, [])).toEqual([])
        })

        it('should return a value of -1 for every primary-key-column that is not part of the header', () => {
            const pk = ['LastName', 'MailAddress']
            const header = ['UserName', 'LastName', 'PhoneNumber']
            expect(createNumericPkIndices(pk, header)).toEqual([1, -1])
        })
    })

    describe('Function: createReorderKey', () => {
        it('should return an array of numeric indices to map the source-columns to the target-columns (-1 when the column is not present)', () => {
            const headerMapping = new Map<string, string>([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['PhoneNumber', ''],
            ])
            const sourceHeader = ['FirstName', 'LastName']
            expect(createReorderKey(headerMapping, sourceHeader)).toEqual([
                1, 0, -1,
            ])
        })

        it('should return an empty array when the provided header mapping is empty', () => {
            const headerMapping = new Map<string, string>()
            const sourceHeader = ['FirstName', 'LastName']
            expect(createReorderKey(headerMapping, sourceHeader)).toEqual([])
        })

        it('should return an array of only -1s when the source-header is empty', () => {
            const headerMapping = new Map<string, string>([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['PhoneNumber', ''],
            ])
            const sourceHeader: string[] = []
            expect(createReorderKey(headerMapping, sourceHeader)).toEqual([
                -1, -1, -1,
            ])
        })
    })

    describe('Function: applyReorderKeyToDataset', () => {
        it('should return the dataset reordered according to the provided reorder key', () => {
            const dataset: string[] = [
                'FirstName',
                'LastName',
                'MailAddress',
                'PhoneNumber',
            ]
            const reorderKey: number[] = [1, 0, 3, 2]
            expect(applyReorderKeyToDataset(dataset, reorderKey)).toEqual([
                'LastName',
                'FirstName',
                'PhoneNumber',
                'MailAddress',
            ])
        })

        it('should return an array of empty strings when the provided dataset is empty', () => {
            const dataset: string[] = []
            const reorderKey: number[] = [2, 3, 0]
            expect(applyReorderKeyToDataset(dataset, reorderKey)).toEqual([
                '',
                '',
                '',
            ])
        })

        it('should return an empty array when the provided reorder key is empty', () => {
            const dataset: string[] = ['FirstName', 'LastName', 'PhoneNumber']
            const reorderKey: number[] = []
            expect(applyReorderKeyToDataset(dataset, reorderKey)).toEqual([])
        })

        it('should return an empty strings for every index out of range', () => {
            const dataset: string[] = ['FirstName', 'LastName', 'PhoneNumber']
            const reorderKey: number[] = [1, 0, 99]
            expect(applyReorderKeyToDataset(dataset, reorderKey)).toEqual([
                'LastName',
                'FirstName',
                '',
            ])
        })
    })

    describe('Function: filterMaps', () => {
        it('should find all elements from Map One that are not present in Map Two', () => {
            const mapOne = new Map<string, string[]>([
                ['key1', ['value1']],
                ['key2', ['value2']],
                ['key3', ['value3']],
                ['key4', ['value4']],
            ])
            const mapTwo = new Map<string, string[]>([
                ['key2', ['value2']],
                ['key3', ['value3']],
            ])
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([['value1'], ['value4']])
        })

        it('should return an empty array when Map One is empty', () => {
            const mapOne = new Map<string, string[]>()
            const mapTwo = new Map<string, string[]>([
                ['key2', ['value2']],
                ['key3', ['value3']],
            ])
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([])
        })

        it('should return an array with all values when Map Two is empty', () => {
            const mapOne = new Map<string, string[]>([
                ['key1', ['value1']],
                ['key2', ['value2']],
                ['key3', ['value3']],
                ['key4', ['value4']],
            ])
            const mapTwo = new Map<string, string[]>()
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([
                ['value1'],
                ['value2'],
                ['value3'],
                ['value4'],
            ])
        })

        it('should return an empty array when both Map One and map Two are empty', () => {
            const mapOne = new Map<string, string[]>()
            const mapTwo = new Map<string, string[]>()
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([])
        })

        it('should return an empty array when every element in Map One is present in Map Two', () => {
            const mapOne = new Map<string, string[]>([
                ['key1', ['value1']],
                ['key2', ['value2']],
                ['key3', ['value3']],
                ['key4', ['value4']],
            ])
            const mapTwo = new Map<string, string[]>([
                ['key1', ['value1']],
                ['key2', ['value2']],
                ['key3', ['value3']],
                ['key4', ['value4']],
            ])
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([])
        })
    })
})
