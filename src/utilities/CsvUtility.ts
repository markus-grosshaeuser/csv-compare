/**
 * Represents a tuple structure that defines a relationship between a target column and a source column.
 *
 * This type is commonly used to map or associate columns in different data sets or tables where
 * the values in a source column need to align or correspond with the values in a target column.
 *
 * Properties:
 * - `target`: Specifies the name of the target column.
 * - `source`: Specifies the name of the source column.
 */
export type MatchingColumnsTuple = {
    target: string
    source: string
}

/**
 * Creates an array of numeric indices based on the positions of primary key values within a header array.
 *
 * @param {string[]} primaryKeyValues - An array of primary key values to be matched within the header.
 * @param {string[]} header - The array that represents the header, used for mapping primary key values to indices.
 * @return {number[]} An array of numeric indices corresponding to the positions of the primary key values in the header.
 * Returns an empty array if the header is empty.
 */
export function createNumericPkIndices(
    primaryKeyValues: string[],
    header: string[],
): number[] {
    if (header.length === 0) {
        return []
    }
    const numericKey: number[] = []
    primaryKeyValues.forEach((value: string) => {
        numericKey.push(header.indexOf(value))
    })
    return numericKey
}

/**
 * Generates a reorder key array, mapping the positions of header values from a source header array.
 *
 * @param {Map<string, string>} headerMap - A map where keys represent reorder criteria and values correspond to header names to be matched.
 * @param {string[]} sourceHeader - An array of strings representing the source header values.
 * @return {number[]} An array of integers representing the positions of the mapped header values from the sourceHeader array. If a value is not found, -1 is used.
 */
export function createReorderKey(
    headerMap: Map<string, string>,
    sourceHeader: string[],
): number[] {
    const reorderKey: number[] = []
    headerMap.forEach((value: string, key: string) => {
        reorderKey.push(key !== '' ? sourceHeader.indexOf(value) : -1)
    })
    return reorderKey
}

/**
 * Reorders elements in a dataset based on a specified reorder key.
 *
 * @param {string[]} sourceLine - The original dataset represented as an array of strings.
 * @param {number[]} reorderKey - An array of indices used to reorder the elements of the dataset.
 * Each index in the reorderKey corresponds to the position of the element to include in the returned dataset.
 * Invalid indices (negative or out of range) will result in an empty string at the corresponding position in the result.
 *
 * @return {string[]} A reordered dataset where elements are arranged according to the positions specified by the reorderKey.
 * Invalid indices in the reorderKey will be replaced with empty strings in the result.
 */
export function applyReorderKeyToDataset(
    sourceLine: string[],
    reorderKey: number[],
): string[] {
    return reorderKey.map((element) => {
        if (element < 0 || element >= sourceLine.length) {
            return ''
        } else {
            return sourceLine[element]
        }
    })
}

/**
 * Filters the entries of the first dataset by excluding any entries whose keys exist in the second dataset.
 *
 * @param {Map<string, string[]>} datasetOne - The first dataset containing key-value pairs to be filtered.
 * @param {Map<string, string[]>} datasetTwo - The second dataset containing keys to be excluded from the first dataset.
 * @return {string[][]} - A 2D array containing values from datasetOne whose keys are not present in datasetTwo.
 */
export function filterMaps(
    datasetOne: Map<string, string[]>,
    datasetTwo: Map<string, string[]>,
): string[][] {
    return Array.from(datasetOne.entries())
        .filter(([key]) => !datasetTwo.has(key))
        .map(([, element]) => element)
}
