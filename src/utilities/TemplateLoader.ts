import axios from 'axios'
import type { Template } from '../redux/templateSlice.ts'

export type TemplateInfo = {
    name: string
    path: string
}

/**
 * Loads the template index from a predefined URL and returns an array of template information.
 *
 * @return {Promise<TemplateInfo[]>} A promise that resolves to an array of template information objects.
 */
export async function loadTemplateIndex(): Promise<TemplateInfo[]> {
    return new Promise<TemplateInfo[]>((resolve, reject) => {
        axios
            .get('/templates.json')
            .then((res) => {
                const response = res.data
                resolve(response.templates)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

/**
 * Finds matching templates based on the provided source and target file headers.
 *
 * @param {string[]} sourceFileHeader - The list of column names in the source file header.
 * @param {string[]} targetFileHeaders - The list of column names in the target file headers.
 * @return {Promise<TemplateInfo[]>} A promise that resolves to an array of matching template information objects.
 */
export async function findMatchingTemplates(
    sourceFileHeader: string[],
    targetFileHeaders: string[],
): Promise<TemplateInfo[]> {
    const predefinedTemplates = await loadTemplateIndex()

    const checkedTemplates = await Promise.all(
        predefinedTemplates.map(async (template: TemplateInfo) => {
            const templateFile = await loadTemplateFromURL(template.path)
            if (
                verifyTemplateFileDataFormat(templateFile) &&
                verifyTemplateApplicableToFileHeaders(
                    templateFile,
                    sourceFileHeader,
                    targetFileHeaders,
                )
            ) {
                return template
            }

            return null
        }),
    )

    return checkedTemplates.filter(
        (template): template is TemplateInfo => template !== null,
    )
}

/**
 * Loads a template from a given URL.
 *
 * @param {string} url - The URL of the template file to load.
 * @return {Promise<Template>} A promise that resolves to the loaded template.
 */
export async function loadTemplateFromURL(url: string): Promise<Template> {
    return new Promise<Template>((resolve, reject) => {
        axios
            .get(url)
            .then((res) => {
                const response = res.data
                resolve(response)
            })
            .catch(() => {
                reject(new Error('Failed to load template from URL'))
            })
    })
}

/**
 * Loads a template from a given file.
 *
 * @param {File} templateFile - The file containing the template data.
 * @return {Promise<Template>} A promise that resolves to the loaded template.
 */
export async function loadTemplateFromFile(
    templateFile: File,
): Promise<Template> {
    const reader = new FileReader()
    return new Promise<Template>((resolve, reject) => {
        reader.onload = (event) => {
            if (event.target) {
                const content = event.target.result as string
                const template = JSON.parse(content) as Template
                resolve(template)
            } else {
                reject(new Error('Failed to read file'))
                throw new Error('Failed to read file')
            }
        }
        reader.readAsText(templateFile)
    })
}

/**
 * Verifies the format of a template files data.
 *
 * @param {Template} template - The template object to verify.
 * @return {boolean} True if the template format is valid, false otherwise.
 */
export function verifyTemplateFileDataFormat(template: Template): boolean {
    const requiredKeys = ['column_match', 'primary_key']
    const missingKeys = requiredKeys.filter((key) => !(key in template))
    return missingKeys.length <= 0
}

export function verifyTemplateApplicableToFileHeaders(
    template: Template,
    sourceFileHeaders: string[],
    targetFileHeaders: string[],
): boolean {
    const templateTargetHeader = template.column_match
        .filter((tuple) => tuple.target !== '')
        .map((tuple) => tuple.target)

    const targetHeaderMatch =
        JSON.stringify(targetFileHeaders) ===
        JSON.stringify(templateTargetHeader)

    const sourceHeaderMatch = template.primary_key.every((templateTuple) =>
        sourceFileHeaders.includes(templateTuple.source),
    )

    return sourceHeaderMatch && targetHeaderMatch
}
