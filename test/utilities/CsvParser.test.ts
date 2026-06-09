import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
    parseFileContent,
    parseFileHeader,
    performParse,
} from '../../src/utilities/CsvParser'
import { reInitiateMockServer } from '../MockServer.ts'

describe('File: CsvParser', () => {
    describe('Test of public functionality', () => {
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
                { target: '', source: 'ZipCode' },
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
            const [insertions, deletions] = await performParse(
                '/source.csv',
                '/target.csv',
            )
            expect(insertions).toEqual(
                'LastName,FirstName,EMailAddress,PhoneNumber\r\nDataC2,DataC3,SyncAttributeC1,,',
            )
            expect(deletions).toEqual(
                'LastName,FirstName,EMailAddress,PhoneNumber\r\nDataB1,DataB2,SyncAttributeB1,DataB4',
            )
        })
    })

    describe('Test file-loading-related functionality', () => {
        beforeAll(() => {
            vi.clearAllMocks()
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
                await expect(parseFileHeader('/file.csv')).rejects.toThrow(
                    Error,
                )
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

            it('should return the content reordered by the provided key', async () => {
                const fileContent =
                    'UserName,LastName,FirstName,Address,PhoneNumber\n' +
                    'DataA1,PkPartA1,DataA3,PkPartA2,DataA5\n' +
                    'DataB1,PkPartB1,DataB3,PkPartB2,DataB5'
                const server = reInitiateMockServer('file.csv', fileContent)
                const data = await parseFileContent(
                    [1, 3],
                    '/file.csv',
                    true,
                    [4, 3, 2, 1, 0],
                )
                const result = new Map<string, string[]>([
                    [
                        JSON.stringify(['PkPartA1', 'PkPartA2']),
                        ['DataA5', 'PkPartA2', 'DataA3', 'PkPartA1', 'DataA1'],
                    ],
                    [
                        JSON.stringify(['PkPartB1', 'PkPartB2']),
                        ['DataB5', 'PkPartB2', 'DataB3', 'PkPartB1', 'DataB1'],
                    ],
                ])
                expect(data).toEqual(result)
                server.close()
            })

            it('should return an error for invalid key indices', async () => {
                const fileContent =
                    'UserName,LastName,FirstName,Address,PhoneNumber\n' +
                    'DataA1,PkPartA1,DataA3,PkPartA2,DataA5'
                const server = reInitiateMockServer('file.csv', fileContent)
                await expect(
                    parseFileContent([1, 99], '/file.csv'),
                ).rejects.toThrow(Error)
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

            it('should return an error when the indicated file cannot be accessed', async () => {
                await expect(
                    parseFileContent([1, 3], '/file.csv'),
                ).rejects.toBeInstanceOf(Error)
            })
        })
    })
})
