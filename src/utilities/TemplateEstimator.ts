import type { Template } from '../redux/templateSlice.ts'
import type { MatchingColumnsTuple } from './CsvUtility.ts'

/**
 * Estimates a template by matching columns from the source header to the target header.
 *
 * @param {string[]} sourceHeader - The list of column names in the source header.
 * @param {string[]} targetHeader - The list of column names in the target header.
 * @return {Template} An object containing the matched columns and additional template metadata.
 */
export default function estimateTemplate(
    sourceHeader: string[],
    targetHeader: string[],
): Template {
    const matchingColumns: MatchingColumnsTuple[] = []
    targetHeader.forEach((targetHeader) => {
        const sourceColumn = sourceHeader.find(
            (sourceHeader) => sourceHeader === targetHeader,
        )
        if (sourceColumn) {
            matchingColumns.push({
                source: sourceColumn,
                target: targetHeader,
            })
        } else {
            matchingColumns.push({
                source: '',
                target: targetHeader,
            })
        }
    })

    return {
        primary_key: [],
        column_match: matchingColumns,
    }
}
