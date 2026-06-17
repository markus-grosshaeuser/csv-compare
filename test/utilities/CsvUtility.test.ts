import { describe, expect, it } from 'vitest'

import {
    createNumericPkIndices,
    createReorderKey,
    applyReorderKey,
    filterMaps,
    getInsertionsAndDeletions,
} from '../../src/utilities/CsvUtility'

describe('File: CsvUtility', () => {
    const sourceHeader = ['UserName', 'LastName', 'FirstName', 'PhoneNumber']
    const targetHeader = ['FirstName', 'LastName', 'EMailAddress', 'ZipCode']

    describe('Function: createNumericPkIndices', () => {
        it('should return arrays of numeric indices for primary key columns - SINGLE KEY', () => {
            const pk = new Map<string, string>([['EMailAddress', 'UserName']])
            const expectation = { sourceKey: [0], targetKey: [2] }
            expect(
                createNumericPkIndices(pk, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return arrays of numeric indices for primary key columns - COMPOUND KEY', () => {
            const pk = new Map<string, string>([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
            ])
            const expectation = { sourceKey: [1, 2], targetKey: [1, 0] }
            expect(
                createNumericPkIndices(pk, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return empty arrays when the provided primary key is empty', () => {
            const pk = new Map<string, string>()
            const expectation = { sourceKey: [], targetKey: [] }
            expect(
                createNumericPkIndices(pk, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return valid data when the provided source header is empty', () => {
            const pk = new Map<string, string>([['EMailAddress', 'UserName']])
            const expectation = { sourceKey: [-1], targetKey: [2] }
            expect(createNumericPkIndices(pk, [], targetHeader)).toEqual(
                expectation,
            )
        })

        it('should return valid data when the provided target header is empty', () => {
            const pk = new Map<string, string>([['EMailAddress', 'UserName']])
            const expectation = { sourceKey: [0], targetKey: [-1] }
            expect(createNumericPkIndices(pk, sourceHeader, [])).toEqual(
                expectation,
            )
        })
    })

    describe('Function: createReorderKey', () => {
        const headerMapping = new Map<string, string>([
            ['FirstName', 'FirstName'],
            ['LastName', 'LastName'],
            ['EMailAddress', ''],
            ['ZipCode', ''],
        ])

        it('should return an array of numeric indices to map the source-columns to the target-columns (-1 when the column is not present)', () => {
            const expectation = [2, 1, -1, -1]
            expect(
                createReorderKey(headerMapping, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return an array with -1s when the provided header mapping is empty', () => {
            const headerMapping = new Map<string, string>()
            const expectation = [-1, -1, -1, -1]
            expect(
                createReorderKey(headerMapping, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return an array of only -1s when the source-header is empty', () => {
            const sourceHeader: string[] = []
            const expectation = [-1, -1, -1, -1]
            expect(
                createReorderKey(headerMapping, sourceHeader, targetHeader),
            ).toEqual(expectation)
        })

        it('should return an empty array when the target-header is empty', () => {
            const targetHeader: string[] = []
            expect(
                createReorderKey(headerMapping, sourceHeader, targetHeader),
            ).toEqual([])
        })
    })

    describe('Function: applyReorderKey', () => {
        const reorderKey: number[] = [1, 2, 0, 3]

        const data: Map<string, string[]> = new Map([
            ['keyA', ['dataA2', 'dataA0', 'dataA1', 'dataA3']],
            ['keyB', ['dataB2', 'dataB0', 'dataB1', 'dataB3']],
        ])

        const expectation: Map<string, string[]> = new Map([
            ['keyA', ['dataA0', 'dataA1', 'dataA2', 'dataA3']],
            ['keyB', ['dataB0', 'dataB1', 'dataB2', 'dataB3']],
        ])

        it('should return the data reordered according to the provided reorder key', () => {
            expect(applyReorderKey(reorderKey, data)).toEqual(expectation)
        })

        it('should return an empty Map when the provided data is empty', () => {
            const data: Map<string, string[]> = new Map()
            expect(applyReorderKey(reorderKey, data)).toEqual(new Map())
        })

        it('should return the original data when the provided reorder key is empty', () => {
            expect(applyReorderKey([], data)).toEqual(data)
        })

        it('should return an empty string for all invalid key-values', () => {
            const reorderKeyWithInvalidData: number[] = [1, -99, 0, 99]
            const expectation = new Map([
                ['keyA', ['dataA0', '', 'dataA2', '']],
                ['keyB', ['dataB0', '', 'dataB2', '']],
            ])
            expect(applyReorderKey(reorderKeyWithInvalidData, data)).toEqual(
                expectation,
            )
        })
    })

    describe('Function: getInsertionsAndDeletions', () => {
        const targetHeader: string[] = ['key', 'value']

        const fromSourceSystem = new Map<string, string[]>([
            ['key1', ['value1']],
            ['key2', ['value2']],
            ['key3', ['value3']],
            ['key4', ['value4']],
        ])

        const fromTargetSystem = new Map<string, string[]>([
            ['key0', ['value0']],
            ['key2', ['value2']],
            ['key3', ['value3']],
            ['key5', ['value5']],
        ])

        it('should find the correct insertions to and deletions from the target system', () => {
            const expectation = {
                insertions: [targetHeader, ['value1'], ['value4']],
                deletions: [targetHeader, ['value0'], ['value5']],
            }
            expect(
                getInsertionsAndDeletions(
                    targetHeader,
                    fromSourceSystem,
                    fromTargetSystem,
                ),
            ).toEqual(expectation)
        })

        it('should return all source system values as insertions (and no deletions) when the target system is empty', () => {
            const expectation = {
                insertions: [
                    targetHeader,
                    ['value1'],
                    ['value2'],
                    ['value3'],
                    ['value4'],
                ],
                deletions: [targetHeader],
            }
            expect(
                getInsertionsAndDeletions(
                    targetHeader,
                    fromSourceSystem,
                    new Map<string, string[]>(),
                ),
            ).toEqual(expectation)
        })

        it('should return all target system values as deletions (and no insertions) when the source system is empty', () => {
            const expectation = {
                insertions: [targetHeader],
                deletions: [
                    targetHeader,
                    ['value0'],
                    ['value2'],
                    ['value3'],
                    ['value5'],
                ],
            }
            expect(
                getInsertionsAndDeletions(
                    targetHeader,
                    new Map<string, string[]>(),
                    fromTargetSystem,
                ),
            ).toEqual(expectation)
        })

        it('should return correct insertions and deletions even when no target header is provided', () => {
            const targetHeader: string[] = []
            const expectation = {
                insertions: [[], ['value1'], ['value4']],
                deletions: [[], ['value0'], ['value5']],
            }
            expect(
                getInsertionsAndDeletions(
                    targetHeader,
                    fromSourceSystem,
                    fromTargetSystem,
                ),
            ).toEqual(expectation)
        })
    })

    describe('Function: filterMaps', () => {
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

        it('should find all elements from Map One that are not present in Map Two', () => {
            const expectation = [['value1'], ['value4']]
            expect(filterMaps(mapOne, mapTwo)).toEqual(expectation)
        })

        it('should return an empty array when Map One is empty', () => {
            const mapOne = new Map<string, string[]>()
            expect(filterMaps(mapOne, mapTwo)).toEqual([])
        })

        it('should return an array with all values when Map Two is empty', () => {
            const mapTwo = new Map<string, string[]>()
            const expectation = [['value1'], ['value2'], ['value3'], ['value4']]
            expect(filterMaps(mapOne, mapTwo)).toEqual(expectation)
        })

        it('should return an empty array when both Map One and map Two are empty', () => {
            const mapOne = new Map<string, string[]>()
            const mapTwo = new Map<string, string[]>()
            expect(filterMaps(mapOne, mapTwo)).toEqual([])
        })

        it('should return an empty array when every element in Map One is present in Map Two', () => {
            const mapTwo = new Map<string, string[]>(mapOne)
            const filteredMap: string[][] = filterMaps(mapOne, mapTwo)
            expect(filteredMap).toEqual([])
        })
    })
})
