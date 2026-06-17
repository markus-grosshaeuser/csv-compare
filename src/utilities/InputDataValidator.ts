import type { MatchingColumnsTuple } from './CsvUtility.ts'

/**
 * Compares the headers of a source and target file against a template's expected headers.
 *
 * @param {Object} template - The template object that defines the expected matching columns between source and target.
 * @param {MatchingColumnsTuple[]} template.column_match - Array of tuples defining the mapping of source- to targetcolumn headers.
 * @param {string[]} sourceHeader - The actual source file headers to compare against the template's expected source headers.
 * @param {string[]} targetHeader - The actual target file headers to compare against the template's expected target headers.
 * @return {boolean} Returns true if both source and target headers match the template; otherwise, false.
 */
export function checkFileHeadersAgainstTemplateHeaders(
    template: {
        primary_key: MatchingColumnsTuple[]
        column_match: MatchingColumnsTuple[]
    },
    sourceHeader: string[],
    targetHeader: string[],
): boolean {
    const templateTargetHeader: string[] = []
    const templateSourceHeader: string[] = []
    template.column_match.forEach(
        ({ source, target }: MatchingColumnsTuple) => {
            templateTargetHeader.push(target)
            if (target !== '' && source !== '') {
                templateSourceHeader.push(source)
            }
        },
    )
    const sourceHeaderMatch: boolean = templateSourceHeader.every(
        (value: string) => sourceHeader.includes(value),
    )
    const targetHeaderMatch: boolean =
        JSON.stringify(templateTargetHeader) === JSON.stringify(targetHeader)

    return sourceHeaderMatch && targetHeaderMatch
}
