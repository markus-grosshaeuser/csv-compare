export type MatchingColumnsTuple = {
    source: string
    target: string
}

/**
 * Creates numeric indices for primary keys based on their positions in source and target headers.
 *
 * @param {Map<string, string>} primaryKey - A mapping of target primary key fields to source primary key fields.
 * @param {string[]} sourceHeader - An array representing the header of the source data, containing field names.
 * @param {string[]} targetHeader - An array representing the header of the target data, containing field names.
 * @return {Object} An object containing numeric indices of source and target primary keys.
 *                  The object includes two properties: 'sourceKey' (array of numeric indices for source primary keys)
 *                  and 'targetKey' (array of numeric indices for target primary keys).
 */
export function createNumericPkIndices(
    primaryKey: Map<string, string>,
    sourceHeader: string[],
    targetHeader: string[],
): { sourceKey: number[]; targetKey: number[] } {
    const targetPrimaryKey: string[] = Array.from(primaryKey.keys())
    const sourcePrimaryKey: string[] = Array.from(primaryKey.values())
    const numericTargetPrimaryKey: number[] = targetPrimaryKey.map(
        (targetPK: string) => targetHeader.indexOf(targetPK),
    )
    const numericSourcePrimaryKey: number[] = sourcePrimaryKey.map(
        (sourcePK: string) => sourceHeader.indexOf(sourcePK),
    )
    return {
        sourceKey: numericSourcePrimaryKey,
        targetKey: numericTargetPrimaryKey,
    }
}

/**
 * Creates a reorder key based on a mapping of target headers to source headers.
 *
 * @param {Map<string, string>} headerMap - A mapping of target headers to source headers.
 * @param {string[]} sourceHeader - An array representing the header of the source data, containing field names.
 * @param {string[]} targetHeader - An array representing the header of the target data, containing field names.
 * @return {number[]} An array of numeric indices representing the reorder key.
 */
export function createReorderKey(
    headerMap: Map<string, string>,
    sourceHeader: string[],
    targetHeader: string[],
): number[] {
    const reorderKey: number[] = []
    targetHeader.forEach((element: string) => {
        const key = headerMap.get(element)
        if (key === undefined) {
            reorderKey.push(-1)
        }
        if (typeof key === 'string') {
            reorderKey.push(key !== '' ? sourceHeader.indexOf(key) : -1)
        }
    })
    return reorderKey
}

/**
 * Reorders the arrays within a Map object according to the specified reorderKey array.
 *
 * @param {number[]} reorderKey - An array of indices specifying the order in which elements of each array in the Map should be rearranged.
 * @param {Map<string, string[]>} data - A Map object where the values are arrays of strings to be reordered based on the reorderKey.
 * @return {Map<string, string[]>} A new Map object containing the arrays with their elements reordered based on the specified reorderKey. If a key in the reorderKey is out of bounds, an empty string is used in its place.
 */
export function applyReorderKey(
    reorderKey: number[],
    data: Map<string, string[]>,
): Map<string, string[]> {
    if (reorderKey.length === 0) {
        return data
    }
    const reorderedData: Map<string, string[]> = new Map<string, string[]>()
    data.forEach((value, key) => {
        const reorderedArray = Array.from(
            reorderKey.map((key) => {
                return key < 0 || key >= value.length ? '' : value[key]
            }),
        )
        reorderedData.set(key, reorderedArray)
    })
    return reorderedData
}

/**
 * Compares the contents of two file content mappings and identifies insertions and deletions
 * based on the differences between the source and target file contents.
 *
 * @param {string[]} targetHeader - The header to be added to the result lists of insertions and deletions.
 * @param {Map<string, string[]>} sourceFileContent - The source file content mapping, where the key is a file identifier and the value is an array of strings representing lines or content.
 * @param {Map<string, string[]>} targetFileContent - The target file content mapping, where the key is a file identifier and the value is an array of strings representing lines or content.
 * @return {Object} An object containing two properties:
 *                  - `insertions`: An array including the target header followed by the lines/content inserted in the target file.
 *                  - `deletions`: An array including the target header followed by the lines/content deleted from the target file.
 */
export function getInsertionsAndDeletions(
    targetHeader: string[],
    sourceFileContent: Map<string, string[]>,
    targetFileContent: Map<string, string[]>,
): { insertions: string[][]; deletions: string[][] } {
    const ins = filterMaps(sourceFileContent, targetFileContent)
    ins.unshift(targetHeader)
    const outs = filterMaps(targetFileContent, sourceFileContent)
    outs.unshift(targetHeader)
    return { insertions: ins, deletions: outs }
}

/**
 * Filters entries in the first dataset by removing any entries that have keys present in the second dataset and extracts their values.
 *
 * @param {Map<string, string[]>} datasetOne - The primary dataset to filter.
 * @param {Map<string, string[]>} datasetTwo - The dataset containing keys to exclude from the first dataset.
 * @return {string[][]} An array of string arrays representing the values from the filtered entries of the first dataset.
 */
export function filterMaps(
    datasetOne: Map<string, string[]>,
    datasetTwo: Map<string, string[]>,
): string[][] {
    return Array.from(datasetOne.entries())
        .filter(([key]) => !datasetTwo.has(key))
        .map(([, element]) => element)
}
