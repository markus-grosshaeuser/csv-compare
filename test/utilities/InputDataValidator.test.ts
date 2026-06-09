import { beforeAll, describe, expect, it, vi } from 'vitest'
import type {MatchingColumnsTuple} from '../../src/utilities/CsvUtility'
import { reInitiateMockServer } from '../MockServer.ts'
import {
    checkFileHeadersAgainstTemplateHeaders,
    makeHeaderComparable,
    validateFilesUsingTemplate,
    type PrimaryKeyHeaderMappingTuple,
} from '../../src/utilities/InputDataValidator'

beforeAll(() => {
    vi.clearAllMocks()
})

describe('File: InputDataValidator', () => {
    describe('Function: validateFilesUsingTemplate', () => {
        it('should return an empty PrimaryKeyHeaderMappingTuple - using SINGLE PK-columns', async () => {
            const sourceHeader = [
                'UserName',
                'LastName',
                'FirstName',
                'PhoneNumber',
            ]
            const destinationHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'ZipCode',
            ]
            const template = {
                column_match: [
                    { target: 'LastName', source: 'LastName' },
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: 'UserName' },
                    { target: 'ZipCode', source: '' },
                    { target: '', source: 'PhoneNumber' },
                ],
                primary_key: [{ target: 'UserName', source: 'EmailAddress' }],
            }
            const server = reInitiateMockServer(
                'template.json',
                JSON.stringify(template),
            )
            const date = await validateFilesUsingTemplate(
                sourceHeader,
                destinationHeader,
            )
            const mockPk = new Map([['UserName', 'EmailAddress']])
            const mockColumnMapping = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['MailAddress', 'UserName'],
                ['ZipCode', ''],
                ['', 'PhoneNumber'],
            ])
            const mockResult: PrimaryKeyHeaderMappingTuple = {
                primaryKey: mockPk,
                headerMapping: mockColumnMapping,
            }
            expect(date).toEqual(mockResult)
            server.close()
        })

        it('should return an empty PrimaryKeyHeaderMappingTuple - using COMPOUND PK-columns', async () => {
            const sourceHeader = [
                'UserName',
                'LastName',
                'FirstName',
                'PhoneNumber',
            ]
            const destinationHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'ZipCode',
            ]
            const template = {
                column_match: [
                    { target: 'LastName', source: 'LastName' },
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: 'UserName' },
                    { target: 'ZipCode', source: '' },
                    { target: '', source: 'PhoneNumber' },
                ],
                primary_key: [
                    { target: 'LastName', source: 'LastName' },
                    { target: 'FirstName', source: 'FirstName' },
                ],
            }
            const server = reInitiateMockServer(
                'template.json',
                JSON.stringify(template),
            )
            const date = await validateFilesUsingTemplate(
                sourceHeader,
                destinationHeader,
            )
            const mockPk = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
            ])
            const mockColumnMapping = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['MailAddress', 'UserName'],
                ['ZipCode', ''],
                ['', 'PhoneNumber'],
            ])
            const mockResult: PrimaryKeyHeaderMappingTuple = {
                primaryKey: mockPk,
                headerMapping: mockColumnMapping,
            }
            expect(date).toStrictEqual(mockResult)
            server.close()
        })

        it('should return an error when the server is unreachable', async () => {
            const sourceHeader = [
                'UserName',
                'LastName',
                'FirstName',
                'PhoneNumber',
            ]
            const destinationHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'ZipCode',
            ]
            await expect(
                validateFilesUsingTemplate(sourceHeader, destinationHeader),
            ).rejects.toBeInstanceOf(Error)
        })

        it('should return an error when template headers do not match file headers', async () => {
            const sourceHeader = [
                'UserName',
                'LastName',
                'FirstName',
                'PhoneNumber',
            ]
            const destinationHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'ZipCode',
            ]
            const template = {
                column_match: [
                    { target: 'Surname', source: 'FamilyName' },
                    { target: 'Name', source: 'Name' },
                    { target: 'Mail', source: 'eMailAddress' },
                    { target: 'OfficeNumber', source: '' },
                    { target: '', source: 'Department' },
                ],
                primary_key: [{ target: 'Mail', source: 'eMailAddress' }],
            }
            const server = reInitiateMockServer(
                'template.json',
                JSON.stringify(template),
            )
            await expect(
                validateFilesUsingTemplate(sourceHeader, destinationHeader),
            ).rejects.toBeInstanceOf(Error)
            server.close()
        })

        it('should return an error when either source-header or destination-header or both is/are empty', async () => {
            const sourceHeader = ['UserName', 'FirstName']
            const destinationHeader = ['FirstName', 'MailAddress']
            const template = {
                column_match: [
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: 'UserName' },
                ],
                primary_key: [{ target: 'MailAddress', source: 'UserName' }],
            }
            const server = reInitiateMockServer(
                'template.json',
                JSON.stringify(template),
            )
            await expect(
                validateFilesUsingTemplate([], destinationHeader),
            ).rejects.toBeInstanceOf(Error)
            await expect(
                validateFilesUsingTemplate(sourceHeader, []),
            ).rejects.toBeInstanceOf(Error)
            await expect(
                validateFilesUsingTemplate([], []),
            ).rejects.toBeInstanceOf(Error)
            server.close()
        })
    })

    describe('Function: makeHeaderComparable', () => {
        it('should return the header-array in sorted order as JSON-string', () => {
            const header = ['LastName', 'FirstName', 'MailAddress', 'ZipCode']
            const expected = JSON.stringify([
                'FirstName',
                'LastName',
                'MailAddress',
                'ZipCode',
            ])
            expect(makeHeaderComparable(header)).toEqual(expected)
        })

        it('should return a template header without empty field and in sorted order as JSON-string', () => {
            const header = [
                '',
                'LastName',
                'FirstName',
                'MailAddress',
                '',
                'ZipCode',
            ]
            const expected = JSON.stringify([
                'FirstName',
                'LastName',
                'MailAddress',
                'ZipCode',
            ])
            expect(makeHeaderComparable(header, true)).toEqual(expected)
        })

        it('should return an empty header as JSON-string when the provides header is empty', () => {
            const header: string[] = []
            const expected = JSON.stringify([])
            expect(makeHeaderComparable(header)).toEqual(expected)
            expect(makeHeaderComparable(header, true)).toEqual(expected)
        })
    })

    describe('Function: checkFileHeadersAgainstTemplateHeaders', () => {
        it('should return true when file headers match template headers', () => {
            const sourceHeader = ['UserName', 'FirstName']
            const destinationHeader = ['FirstName', 'MailAddress']
            const template = {
                column_match: [
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: 'UserName' },
                ],
                primary_key: [{ target: 'MailAddress', source: 'UserName' }],
            }
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    template,
                    sourceHeader,
                    destinationHeader,
                ),
            ).toBe(true)
        })

        it('should return false when file headers do not match template headers', () => {
            const sourceHeader = ['UserName', 'FirstName']
            const destinationHeader = ['FirstName', 'MailAddress']
            const template = {
                column_match: [
                    { target: 'LastName', source: 'LastName' },
                    { target: 'eMailAddress', source: 'Mail' },
                ],
                primary_key: [{ target: 'eMailAddress', source: 'Mail' }],
            }
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    template,
                    sourceHeader,
                    destinationHeader,
                ),
            ).toBe(false)
        })

        it('should return false when the template is empty', () => {
            const emptyTemplate: {
                column_match: Array<MatchingColumnsTuple>
                primary_key: Array<MatchingColumnsTuple>
            } = {
                column_match: [],
                primary_key: [],
            }
            const sourceHeader = ['UserName', 'FirstName']
            const destinationHeader = ['FirstName', 'MailAddress']
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    emptyTemplate,
                    sourceHeader,
                    destinationHeader,
                ),
            ).toBe(false)
        })

        it('should return false when either source- or destination-header or booth is/are empty', () => {
            const sourceHeader = ['UserName', 'FirstName']
            const destinationHeader = ['FirstName', 'MailAddress']
            const template = {
                column_match: [
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: 'UserName' },
                ],
                primary_key: [{ target: 'MailAddress', source: 'UserName' }],
            }
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    template,
                    [],
                    destinationHeader,
                ),
            ).toBe(false)
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    template,
                    sourceHeader,
                    [],
                ),
            ).toBe(false)
            expect(
                checkFileHeadersAgainstTemplateHeaders(template, [], []),
            ).toBe(false)
        })
    })
})
