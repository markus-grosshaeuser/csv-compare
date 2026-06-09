import axios from 'axios'
import type { MatchingColumnsTuple } from './CsvUtility.ts'


/**
 * Represents a data structure that encapsulates the relationship between primary keys and
 * header mappings, both stored as maps with string-based keys and values.
 *
 * This type can be used to associate primary keys of a dataset with their respective
 * mappings to headers, allowing for flexible and dynamic data management in scenarios
 * where mappings may frequently change or need runtime computation.
 */
export type PrimaryKeyHeaderMappingTuple = {
    primaryKey: Map<string, string>
    headerMapping: Map<string, string>
}

/**
 * Validates the headers of source and destination files using a template from a remote server.
 *
 * @param {string[]} sourceHeader - Array containing the header names of the source file.
 * @param {string[]} destinationHeader - Array containing the header names of the destination file.
 * @return {Promise<PrimaryKeyHeaderMappingTuple>} A promise that resolves with an object containing two maps:
 *                                          1. A map of primary key column mappings.
 *                                          2. A map of general column mappings between the source and destination.
 */
export async function validateFilesUsingTemplate(
    sourceHeader: string[],
    destinationHeader: string[],
): Promise<PrimaryKeyHeaderMappingTuple> {
    return new Promise((resolve, reject) => {
        axios
            .get('/template.json')
            .then((template) => {
                if (
                    checkFileHeadersAgainstTemplateHeaders(
                        template.data,
                        sourceHeader,
                        destinationHeader,
                    )
                ) {
                    const primaryKeyMap: Map<string, string> = new Map<
                        string,
                        string
                    >()
                    template.data.primary_key.forEach(
                        (column: MatchingColumnsTuple) => {
                            primaryKeyMap.set(column.target, column.source)
                        },
                    )

                    const headersMap: Map<string, string> = new Map<
                        string,
                        string
                    >()
                    template.data.column_match.forEach(
                        (column: MatchingColumnsTuple) => {
                            headersMap.set(column.target, column.source)
                        },
                    )
                    resolve({
                        primaryKey: primaryKeyMap,
                        headerMapping: headersMap,
                    })
                } else {
                    reject(
                        new Error('Template headers do not match file headers'),
                    )
                }
            })
            .catch(() => {
                console.log('Server Unreachable')
                reject(new Error('Server Unreachable'))
            })
    })
}

/**
 * Processes the input header array by filtering empty strings if it is a template header
 * and returns a sorted JSON string representation of the header.
 *
 * @param {string[]} inputHeader - The array of strings that represents the input header.
 * @param {boolean} isTemplateHeader - A flag indicating whether the header is a template header.
 *                                     If true, empty strings will be filtered from the header.
 * @return {string} A JSON string representation of the processed and sorted header array.
 */
export function makeHeaderComparable(
    inputHeader: string[],
    isTemplateHeader: boolean = false,
): string {
    let header = Array.from(inputHeader)
    header = isTemplateHeader
        ? header.filter((value: string) => {
              return value !== ''
          })
        : header
    return JSON.stringify(header.sort((a, b) => a.localeCompare(b)))
}

/**
 * Compares the headers of a source and destination file against a template's expected headers.
 *
 * @param {Object} template - The template object that defines the expected matching columns between source and destination.
 * @param {MatchingColumnsTuple[]} template.column_match - Array of tuples defining the mapping of source to destination column headers.
 * @param {string[]} sourceHeader - The actual source file headers to compare against the template's expected source headers.
 * @param {string[]} destinationHeader - The actual destination file headers to compare against the template's expected destination headers.
 * @return {boolean} Returns true if both source and destination headers match the template; otherwise, false.
 */
export function checkFileHeadersAgainstTemplateHeaders(
    template: { column_match: MatchingColumnsTuple[] },
    sourceHeader: string[],
    destinationHeader: string[],
): boolean {
    if (!template.column_match?.length) {
        return false
    }

    const templateSourceHeader: string[] = []
    const templateDestinationHeader: string[] = []
    template.column_match.forEach((column: MatchingColumnsTuple) => {
        templateSourceHeader.push(column.source)
        templateDestinationHeader.push(column.target)
    })
    const sourceHeaderMatch: boolean =
        makeHeaderComparable(templateSourceHeader, true) ===
        makeHeaderComparable(sourceHeader, false)
    const destinationHeaderMatch: boolean =
        makeHeaderComparable(templateDestinationHeader, true) ===
        makeHeaderComparable(destinationHeader, false)
    return sourceHeaderMatch && destinationHeaderMatch
}
