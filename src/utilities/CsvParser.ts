import Papa, { unparse } from 'papaparse'
import {
    applyReorderKeyToDataset,
    createNumericPkIndices,
    createReorderKey,
    filterMaps,
} from './CsvUtility.ts'
import {
    type PrimaryKeyHeaderMappingTuple,
    validateFilesUsingTemplate,
} from './InputDataValidator.ts'

/**
 * Parses the given input files, processes their content based on their headers and primary key mappings,
 * and generates output data representing differences between them.
 *
 * @param {string} sourceInFile - The path to the source input file to be parsed.
 * @param {string} destinationInFile - The path to the destination input file to be parsed.
 * @return {Promise<[string, string]>} A promise that resolves with an array where the first element is the parsed "insert" data
 * and the second element is the parsed "delete" data (both with respect to the destination).
 */
export async function performParse(
    sourceInFile: string,
    destinationInFile: string,
): Promise<[string, string]> {
    const destinationHeader = await parseFileHeader(destinationInFile)
    const sourceHeader = await parseFileHeader(sourceInFile)

    const validationResult: PrimaryKeyHeaderMappingTuple =
        await validateFilesUsingTemplate(sourceHeader, destinationHeader)
    const primaryKey = validationResult.primaryKey
    const headerMapping = validationResult.headerMapping

    const destinationPrimaryKey: string[] = []
    primaryKey.forEach((_: string, destinationPK: string) => {
        destinationPrimaryKey.push(destinationPK)
    })
    const destinationKey = createNumericPkIndices(
        destinationPrimaryKey,
        destinationHeader,
    )

    const sourcePrimaryKey: string[] = []
    primaryKey.forEach((sourcePK: string) => {
        sourcePrimaryKey.push(sourcePK)
    })
    const sourceKey = createNumericPkIndices(sourcePrimaryKey, sourceHeader)

    const reorderKey = createReorderKey(headerMapping, sourceHeader)

    const destinationFileContent = await parseFileContent(
        destinationKey,
        destinationInFile,
    )
    const sourceFileContent = await parseFileContent(
        sourceKey,
        sourceInFile,
        true,
        reorderKey,
    )

    const ins = filterMaps(sourceFileContent, destinationFileContent)
    const outs = filterMaps(destinationFileContent, sourceFileContent)

    ins.unshift(destinationHeader)
    outs.unshift(destinationHeader)

    return [unparse(ins), unparse(outs)]
}

/**
 * Parses the header (first row) of a CSV file from the specified URL.
 *
 * @param {string} inFileURL - The URL of the CSV file to parse.
 * @return {Promise<string[]>} A promise that resolves to an array of strings representing the header row of the file.
 * If the file is empty or contains no rows, the promise resolves to an empty array.
 * If an error occurs during parsing, the promise rejects with an error.
 */
export async function parseFileHeader(inFileURL: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(inFileURL, {
            download: true,
            header: false,
            worker: true,
            skipEmptyLines: true,
            complete: function (result: Papa.ParseResult<string[]>) {
                if (result.data.length > 0) {
                    resolve(result.data[0])
                } else {
                    resolve([])
                }
            },
            error: function () {
                reject(new Error('Failed to parse file header'))
            },
        })
    })
}

/**
 * Parses the content of a file from the given URL and organizes it into a map structure based on specific key indices.
 *
 * @param {number[]} keyIndices - An array of indices that determines how the keys of the resulting map will be generated.
 * @param {string} inFileURL - The URL of the file to be parsed.
 * @param {boolean} [reorder=false] - A flag indicating whether the parsed content should be reordered based on the provided reorder keys.
 * @param {number[]} [reorderKey=[]] - An array of indices specifying the reorder pattern for the content if `reorder` is set to true.
 * @return {Promise<Map<string, string[]>>} A promise that resolves to a map where the keys are stringified arrays based
 * on the specified indices, and the values are arrays representing parsed rows.
 */
export async function parseFileContent(
    keyIndices: number[],
    inFileURL: string,
    reorder: boolean = false,
    reorderKey: number[] = [],
): Promise<Map<string, string[]>> {
    if (keyIndices.length === 0) {
        throw new Error('No key indices provided')
    }
    return new Promise((resolve, reject) => {
        Papa.parse(inFileURL, {
            download: true,
            header: false,
            worker: true,
            skipFirstNLines: 1,
            skipEmptyLines: true,
            complete: function (results: Papa.ParseResult<string[]>) {
                const dataset = new Map<string, string[]>()
                results.data.forEach((result: string[]) => {
                    const invalidKeys = keyIndices.find(
                        (value) => value < 0 || value >= result.length,
                    )
                    if (invalidKeys !== undefined) {
                        reject(
                            new Error(
                                `Out of bound access using key index ${invalidKeys} for result length ${result.length}`,
                            ),
                        )
                        return
                    }
                    const key: string[] = keyIndices.map(
                        (value) => result[value],
                    )
                    result = reorder
                        ? applyReorderKeyToDataset(result, reorderKey)
                        : result
                    dataset.set(JSON.stringify(key), result)
                })
                resolve(dataset)
            },
            error: function () {
                reject(new Error('Failed to parse file header'))
            },
        })
    })
}
