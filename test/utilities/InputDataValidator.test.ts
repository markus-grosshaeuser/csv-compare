import { beforeAll, describe, expect, it, vi } from 'vitest'
import { checkFileHeadersAgainstTemplateHeaders } from '../../src/utilities/InputDataValidator'

beforeAll(() => {
    vi.clearAllMocks()
})

describe('File: InputDataValidator', () => {
    describe('Function: checkFileHeadersAgainstTemplateHeaders', () => {
        const sourceHeader = ['UserName', 'FirstName']
        const targetHeader = ['FirstName', 'MailAddress']
        const template = {
            column_match: [
                { target: 'FirstName', source: 'FirstName' },
                { target: 'MailAddress', source: 'UserName' },
            ],
            primary_key: [{ target: 'MailAddress', source: 'UserName' }],
        }

        it('should return true when file headers match template headers', () => {
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    template,
                    sourceHeader,
                    targetHeader,
                ),
            ).toBe(true)
        })

        it('should return false when file headers do not match template headers', () => {
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
                    targetHeader,
                ),
            ).toBe(false)
        })

        it('should return false when the template is empty', () => {
            const emptyTemplate = {
                column_match: [],
                primary_key: [],
            }
            expect(
                checkFileHeadersAgainstTemplateHeaders(
                    emptyTemplate,
                    sourceHeader,
                    targetHeader,
                ),
            ).toBe(false)
        })

        it('should return false when either source- or target-header or booth is/are empty', () => {
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
                    targetHeader,
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
