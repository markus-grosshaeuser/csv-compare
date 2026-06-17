import Papa, { unparse } from 'papaparse'
import {
    applyReorderKey,
    createNumericPkIndices,
    createReorderKey,
    getInsertionsAndDeletions,
    type MatchingColumnsTuple,
} from './CsvUtility.ts'
import { checkFileHeadersAgainstTemplateHeaders } from './InputDataValidator.ts'
import type { Template } from '../redux/templateSlice.ts'

/**
 * Processes files by validating and comparing headers, then performing transformations
 * to compute insertions and deletions based on the source and target file content.
 *
 * @param {Template} template - The template object containing header mapping and primary key definitions.
 * @param {string[]} sourceHeader - The header row of the source file.
 * @param {string} sourceInFile - The content of the source file.
 * @param {string[]} targetHeader - The header row of the target file.
 * @param {string} targetInFile - The content of the target file.
 * @return {Promise<[string, string]>} A promise that resolves to a tuple containing two strings:
 * the unparsed insertions for the target file and the unparsed deletions for the source file.
 * @throws {Error} If the headers of the source or target files do not match the template headers.
 */
export async function processFiles(
    template: Template,
    sourceHeader: string[],
    sourceInFile: string,
    targetHeader: string[],
    targetInFile: string,
): Promise<[string, string]> {
    if (
        !checkFileHeadersAgainstTemplateHeaders(
            template,
            sourceHeader,
            targetHeader,
        )
    ) {
        throw new Error('File headers do not match template headers')
    }

    const { primaryKey, headerMapping } =
        extractPrimaryKeyAndHeaderMapping(template)
    const { sourceKey, targetKey } = createNumericPkIndices(
        primaryKey,
        sourceHeader,
        targetHeader,
    )
    const reorderKey = createReorderKey(
        headerMapping,
        sourceHeader,
        targetHeader,
    )

    const targetFileContent = await parseFileContent(targetKey, targetInFile)
    const rawSourceFileContent = await parseFileContent(sourceKey, sourceInFile)
    const sourceFileContent = applyReorderKey(reorderKey, rawSourceFileContent)

    const { insertions, deletions } = getInsertionsAndDeletions(
        targetHeader,
        sourceFileContent,
        targetFileContent,
    )
    return [unparse(insertions), unparse(deletions)]
}

/**
 * Parses the header row of a file and returns it as an array of strings.
 * The file is processed asynchronously and must be in a format compatible with PapaParse.
 *
 * @param {string} inFile - The path or URL of the file to be parsed. Must not be an empty string.
 * @return {Promise<string[]>} A promise that resolves to an array of strings representing the header row of the file.
 *                              If the file contains no data, resolves to an empty array.
 *                              Rejects with an error if parsing fails.
 */
export async function parseFileHeader(inFile: string): Promise<string[]> {
    if (inFile === '') {
        throw new Error('No file provided')
    }
    return new Promise((resolve, reject) => {
        Papa.parse(inFile, {
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
 * Parses the content of a file and returns it as a Map of primary keys to rows.
 * The file is processed asynchronously and must be in a format compatible with PapaParse.
 *
 * @param {number[]} numericPkIndices - An array of indices representing the primary key columns in the file.
 * @param {string} inFile - The path or URL of the file to be parsed. Must not be an empty string.
 * @return {Promise<Map<string, string[]>>} A promise that resolves to a Map where each key is a primary key
 *                                           and each value is an array of strings representing a row of the file.
 *                                           Rejects with an error if parsing fails.
 * @throws {Error} If no primary key indices are provided or if the file contains no data.
 */
export async function parseFileContent(
    numericPkIndices: number[],
    inFile: string,
): Promise<Map<string, string[]>> {
    if (inFile === '') {
        throw new Error('No file url provided')
    }
    return new Promise((resolve, reject) => {
        Papa.parse(inFile, {
            download: true,
            header: false,
            worker: true,
            skipEmptyLines: true,
            skipFirstNLines: 1,
            complete: function (result: Papa.ParseResult<string[]>) {
                if (!(numericPkIndices.length > 0)) {
                    reject(new Error('No primary key indices provided'))
                    return
                }
                const content = new Map<string, string[]>()
                result.data.forEach((row: string[]) => {
                    const pk: string[] = numericPkIndices.map(
                        (index) => row[index],
                    )
                    content.set(JSON.stringify(pk), row)
                })
                resolve(content)
            },
            error: function () {
                reject(new Error('Failed to parse file header'))
            },
        })
    })
}

/**
 * Extracts primary key and header mappings from the provided template.
 * Populates a mapping of primary keys and header mappings based on the
 * target and source column information specified in the template.
 *
 * @param {Template} template - The template object containing primary key
 * and column match information.
 * @return {Object} An object with two properties:
 * - `primaryKey`: A Map where the key is the target column name and the value
 *   is the source column name, derived from the template's primary key mapping.
 * - `headerMapping`: A Map where the key is the target column name and the value
 *   is the source column name, derived from the template's column match mapping.
 */
export function extractPrimaryKeyAndHeaderMapping(template: Template): {
    primaryKey: Map<string, string>
    headerMapping: Map<string, string>
} {
    const primaryKeyMap: Map<string, string> = new Map<string, string>(
        template.primary_key.map((column: MatchingColumnsTuple) => {
            return [column.target, column.source]
        }),
    )
    const headersMap: Map<string, string> = new Map<string, string>()
    template.column_match.forEach((column: MatchingColumnsTuple) => {
        if (column.target !== '' && column.source !== '') {
            headersMap.set(column.target, column.source)
        }
    })
    return {
        primaryKey: primaryKeyMap,
        headerMapping: headersMap,
    }
}
