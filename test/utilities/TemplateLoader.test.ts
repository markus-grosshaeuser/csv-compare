import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
    findMatchingTemplates,
    loadTemplateFromFile,
    loadTemplateFromURL,
    loadTemplateIndex,
    verifyTemplateApplicableToFileHeaders,
    verifyTemplateFileDataFormat,
    type TemplateInfo,
} from '../../src/utilities/TemplateLoader.ts'
import type { Template } from '../../src/redux/templateSlice.ts'

vi.mock('axios')

const mockedAxios = vi.mocked(axios)

describe('File: TemplateLoader', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Function: loadTemplateIndex', () => {
        it('should load and return the template index from templates.json', async () => {
            const templates: TemplateInfo[] = [
                { name: 'Template 1', path: '/templates/template-1.json' },
                { name: 'Template 2', path: '/templates/template-2.json' },
            ]

            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    templates,
                },
            })

            await expect(loadTemplateIndex()).resolves.toEqual(templates)
            expect(mockedAxios.get).toHaveBeenCalledWith('/templates.json')
        })

        it('should reject when loading the template index fails', async () => {
            const error = new Error('Failed to load template index')

            mockedAxios.get.mockRejectedValueOnce(error)

            await expect(loadTemplateIndex()).rejects.toThrow(
                'Failed to load template index',
            )
            expect(mockedAxios.get).toHaveBeenCalledWith('/templates.json')
        })
    })

    describe('Function: findMatchingTemplates', () => {
        it('should return only templates matching the source and target headers', async () => {
            const matchingTemplateInfo: TemplateInfo = {
                name: 'Matching template',
                path: '/templates/matching-template.json',
            }
            const nonMatchingTemplateInfo: TemplateInfo = {
                name: 'Non-matching template',
                path: '/templates/non-matching-template.json',
            }

            const matchingTemplate: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                    { source: '', target: '' },
                ],
            }

            const nonMatchingTemplate: Template = {
                primary_key: [{ source: 'MissingColumn', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            mockedAxios.get
                .mockResolvedValueOnce({
                    data: {
                        templates: [
                            matchingTemplateInfo,
                            nonMatchingTemplateInfo,
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    data: matchingTemplate,
                })
                .mockResolvedValueOnce({
                    data: nonMatchingTemplate,
                })

            const result = await findMatchingTemplates(
                ['UserName', 'FirstName', 'LastName'],
                ['FirstName', 'LastName'],
            )

            expect(result).toEqual([matchingTemplateInfo])
            expect(mockedAxios.get).toHaveBeenCalledWith('/templates.json')
            expect(mockedAxios.get).toHaveBeenCalledWith(
                matchingTemplateInfo.path,
            )
            expect(mockedAxios.get).toHaveBeenCalledWith(
                nonMatchingTemplateInfo.path,
            )
        })

        it('should ignore templates with an invalid data format', async () => {
            const templateInfo: TemplateInfo = {
                name: 'Invalid template',
                path: '/templates/invalid-template.json',
            }

            const invalidTemplate = {
                column_match: [{ source: 'FirstName', target: 'FirstName' }],
            } as Template

            mockedAxios.get
                .mockResolvedValueOnce({
                    data: {
                        templates: [templateInfo],
                    },
                })
                .mockResolvedValueOnce({
                    data: invalidTemplate,
                })

            const result = await findMatchingTemplates(
                ['FirstName'],
                ['FirstName'],
            )

            expect(result).toEqual([])
        })
    })

    describe('Function: loadTemplateFromURL', () => {
        it('should load and return a template from a URL', async () => {
            const template: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            mockedAxios.get.mockResolvedValueOnce({
                data: template,
            })

            await expect(
                loadTemplateFromURL('/templates/template.json'),
            ).resolves.toEqual(template)
            expect(mockedAxios.get).toHaveBeenCalledWith(
                '/templates/template.json',
            )
        })

        it('should reject when loading a template from a URL fails', async () => {
            const error = new Error('Failed to load template')

            mockedAxios.get.mockRejectedValueOnce(error)

            await expect(
                loadTemplateFromURL('/templates/template.json'),
            ).rejects.toThrow('Failed to load template')
            expect(mockedAxios.get).toHaveBeenCalledWith(
                '/templates/template.json',
            )
        })
    })

    describe('Function: loadTemplateFromFile', () => {
        it('should load and parse a template from a file', async () => {
            const template: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            const file = new File([JSON.stringify(template)], 'template.json', {
                type: 'application/json',
            })

            await expect(loadTemplateFromFile(file)).resolves.toEqual(template)
        })

        it('should reject when the file content is not valid JSON', async () => {
            const file = new File(['not valid json'], 'template.json', {
                type: 'application/json',
            })

            expect(loadTemplateFromFile(file)).toThrow(Error)
        })
    })

    describe('Function: verifyTemplateFileDataFormat', () => {
        it('should return true when the template contains all required keys', () => {
            const template: Template = {
                primary_key: [],
                column_match: [],
            }

            expect(verifyTemplateFileDataFormat(template)).toBe(true)
        })
    })

    describe('Function: verifyTemplateApplicableToFileHeaders', () => {
        it('should return true when source primary keys and target headers match', () => {
            const template: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                    { source: '', target: '' },
                ],
            }

            expect(
                verifyTemplateApplicableToFileHeaders(
                    template,
                    ['UserName', 'FirstName', 'LastName'],
                    ['FirstName', 'LastName'],
                ),
            ).toBe(true)
        })

        it('should return false when a primary key source is missing from the source headers', () => {
            const template: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            expect(
                verifyTemplateApplicableToFileHeaders(
                    template,
                    ['FirstName', 'LastName'],
                    ['FirstName', 'LastName'],
                ),
            ).toBe(false)
        })

        it('should return false when target headers do not match the template column order', () => {
            const template: Template = {
                primary_key: [{ source: 'UserName', target: 'UserName' }],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            expect(
                verifyTemplateApplicableToFileHeaders(
                    template,
                    ['UserName', 'FirstName', 'LastName'],
                    ['LastName', 'FirstName'],
                ),
            ).toBe(false)
        })

        it('should ignore empty target values when comparing target headers', () => {
            const template: Template = {
                primary_key: [],
                column_match: [
                    { source: 'FirstName', target: 'FirstName' },
                    { source: '', target: '' },
                    { source: 'LastName', target: 'LastName' },
                ],
            }

            expect(
                verifyTemplateApplicableToFileHeaders(
                    template,
                    ['FirstName', 'LastName'],
                    ['FirstName', 'LastName'],
                ),
            ).toBe(true)
        })
    })
})
