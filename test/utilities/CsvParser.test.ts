import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
    extractPrimaryKeyAndHeaderMapping,
    parseFileContent,
    parseFileHeader,
    processFiles,
} from '../../src/utilities/CsvParser'
import { reInitiateMockServer } from '../MockServer.ts'

describe('File: CsvParser', () => {
    describe('Function: processFile', () => {
        beforeAll(() => {
            vi.clearAllMocks()
        })
        afterAll(() => server.close())

        const sourceFileContent =
            'UserName,LastName,FirstName,ZipCode\n' +
            'SyncAttributeA1,DataA2,DataA3,DataA4\n' +
            'SyncAttributeC1,DataC2,DataC3,DataC4\n' +
            'SyncAttributeD1,DataD2,DataD3,DataD4'

        const targetFileContent =
            'LastName,FirstName,EMailAddress,PhoneNumber\n' +
            'DataA1,DataA2,SyncAttributeA1,DataA4\n' +
            'DataB1,DataB2,SyncAttributeB1,DataB4\n' +
            'DataD1,DataD2,SyncAttributeD1,DataD4'

        const template = {
            column_match: [
                { target: 'LastName', source: 'LastName' },
                { target: 'FirstName', source: 'FirstName' },
                { target: 'EMailAddress', source: 'UserName' },
                { target: 'PhoneNumber', source: '' },
            ],
            primary_key: [{ target: 'EMailAddress', source: 'UserName' }],
        }
        const restHandlers = [
            http.get('/source.csv', () => {
                return HttpResponse.text(sourceFileContent)
            }),
            http.get('/target.csv', () => {
                return HttpResponse.text(targetFileContent)
            }),
            http.get('/template.json', () => {
                return HttpResponse.json(template)
            }),
        ]

        const server = setupServer(...restHandlers)
        server.listen({ onUnhandledRequest: 'error' })

        it('should return all datasets that need to be synchronized between source and target', async () => {
            const [insertions, deletions] = await processFiles(
                template,
                ['UserName', 'LastName', 'FirstName', 'ZipCode'],
                '/source.csv',
                ['LastName', 'FirstName', 'EMailAddress', 'PhoneNumber'],
                '/target.csv',
            )
            expect(insertions).toEqual(
                'LastName,FirstName,EMailAddress,PhoneNumber\r\nDataC2,DataC3,SyncAttributeC1,',
            )
            expect(deletions).toEqual(
                'LastName,FirstName,EMailAddress,PhoneNumber\r\nDataB1,DataB2,SyncAttributeB1,DataB4',
            )
        })

        it('should throw an error when file header dont match with template', async () => {
            await expect(
                processFiles(
                    template,
                    ['Test', 'Test'],
                    '/source.csv',
                    ['test', 'test'],
                    '/target.csv',
                ),
            ).rejects.toThrow(Error)
        })
    })

    describe('Function: parseFileHeader', () => {
        it('should return the correct header', async () => {
            const fileContent =
                'UserName,LastName,FirstName,Address,PhoneNumber\nData,Data,Data,Data,Data'
            const server = reInitiateMockServer('file.csv', fileContent)
            const data = await parseFileHeader('/file.csv')
            expect(data).toEqual([
                'UserName',
                'LastName',
                'FirstName',
                'Address',
                'PhoneNumber',
            ])
            server.close()
        })

        it('should returns the correct header, even when the file contains nothing but the header', async () => {
            const server = reInitiateMockServer(
                'file.csv',
                'UserName,LastName,FirstName,Address,PhoneNumber',
            )
            const data = await parseFileHeader('/file.csv')
            expect(data).toEqual([
                'UserName',
                'LastName',
                'FirstName',
                'Address',
                'PhoneNumber',
            ])
            server.close()
        })

        it('should return an empty array when the file is empty', async () => {
            const server = reInitiateMockServer('file.csv', '')
            const data = await parseFileHeader('/file.csv')
            expect(data).toEqual([])
            server.close()
        })

        it('should return an error when an empty string is provided as file-URL', async () => {
            const server = reInitiateMockServer('file.csv', '')
            await expect(parseFileHeader('')).rejects.toBeInstanceOf(Error)
            server.close()
        })

        it('should return an error when the indicated file cannot be accessed', async () => {
            await expect(parseFileHeader('/file.csv')).rejects.toThrow(Error)
        })
    })

    describe('Function: parseFileContent', () => {
        it('should return the correct content', async () => {
            const fileContent =
                'UserName,LastName,FirstName,Address,PhoneNumber\n' +
                'DataA1,PkPartA1,DataA3,PkPartA2,DataA5\n' +
                'DataB1,PkPartB1,DataB3,PkPartB2,DataB5'
            const server = reInitiateMockServer('file.csv', fileContent)
            const data = await parseFileContent([1, 3], '/file.csv')
            const result = new Map<string, string[]>([
                [
                    JSON.stringify(['PkPartA1', 'PkPartA2']),
                    ['DataA1', 'PkPartA1', 'DataA3', 'PkPartA2', 'DataA5'],
                ],
                [
                    JSON.stringify(['PkPartB1', 'PkPartB2']),
                    ['DataB1', 'PkPartB1', 'DataB3', 'PkPartB2', 'DataB5'],
                ],
            ])
            expect(data).toEqual(result)
            server.close()
        })

        it('should return an empty Map when the file contains nothing but the header', async () => {
            const fileContent =
                'UserName,LastName,FirstName,Address,PhoneNumber'
            const server = reInitiateMockServer('file.csv', fileContent)
            const data = await parseFileContent([1, 3], '/file.csv')
            expect(data).toEqual(new Map<string, string[]>())
            server.close()
        })

        it('should return an empty Map when the file is empty', async () => {
            const server = reInitiateMockServer('file.csv', '')
            const data = await parseFileContent([1, 3], '/file.csv')
            expect(data).toEqual(new Map<string, string[]>())
            server.close()
        })

        it('should return an error when no key indices are provided', async () => {
            const fileContent =
                'UserName,LastName,FirstName,Address,PhoneNumber\n' +
                'DataA1,PkPartA1,DataA3,PkPartA2,DataA5'
            const server = reInitiateMockServer('file.csv', fileContent)
            await expect(
                parseFileContent([], '/file.csv'),
            ).rejects.toBeInstanceOf(Error)
            server.close()
        })

        it('should return an error when an empty string is provided as file-URL', async () => {
            const server = reInitiateMockServer('file.csv', '')
            await expect(parseFileContent([0], '')).rejects.toBeInstanceOf(
                Error,
            )
            server.close()
        })

        it('should return an error when the indicated file cannot be accessed', async () => {
            await expect(
                parseFileContent([1, 3], '/file.csv'),
            ).rejects.toBeInstanceOf(Error)
        })
    })

    describe('Function: extractPrimaryKeyAndHeaderMapping', () => {
        const column_match = [
            { target: 'LastName', source: 'LastName' },
            { target: 'FirstName', source: 'FirstName' },
            { target: 'MailAddress', source: 'UserName' },
            { target: 'ZipCode', source: '' },
        ]

        const singlePk = [{ target: 'MailAddress', source: 'UserName' }]

        const compoundPk = [
            { target: 'LastName', source: 'LastName' },
            { target: 'FirstName', source: 'FirstName' },
        ]

        it('should return a valid PrimaryKeyHeaderMappingTuple - using SINGLE PK-columns', () => {
            const template = {
                column_match: column_match,
                primary_key: singlePk,
            }
            const expectedPk = new Map([['MailAddress', 'UserName']])
            const expectedColumnMapping = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['MailAddress', 'UserName'],
            ])
            const expectation = {
                primaryKey: expectedPk,
                headerMapping: expectedColumnMapping,
            }

            expect(extractPrimaryKeyAndHeaderMapping(template)).toStrictEqual(
                expectation,
            )
        })

        it('should return a valid PrimaryKeyHeaderMappingTuple - using COMPOUND PK-columns', async () => {
            const template = {
                column_match: column_match,
                primary_key: compoundPk,
            }
            const expectedPk = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
            ])
            const expectedColumnMapping = new Map([
                ['LastName', 'LastName'],
                ['FirstName', 'FirstName'],
                ['MailAddress', 'UserName'],
            ])
            const expectation = {
                primaryKey: expectedPk,
                headerMapping: expectedColumnMapping,
            }
            expect(extractPrimaryKeyAndHeaderMapping(template)).toStrictEqual(
                expectation,
            )
        })
    })
})
