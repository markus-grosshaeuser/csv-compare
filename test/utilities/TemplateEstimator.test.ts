import { describe, it, expect } from 'vitest'
import estimateTemplate from '../../src/utilities/TemplateEstimator.ts'

describe('File: TemplateEstimator', () => {
    describe('Function: estimateTemplate', () => {
        it('should return a template based on the target header with column_match containing all columns that could be matched by name', () => {
            const sourceHeader = [
                'UserName',
                'FirstName',
                'LastName',
                'JobTitle',
            ]
            const targetHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'City',
            ]
            const expectation = {
                column_match: [
                    { target: 'LastName', source: 'LastName' },
                    { target: 'FirstName', source: 'FirstName' },
                    { target: 'MailAddress', source: '' },
                    { target: 'City', source: '' },
                ],
                primary_key: [],
            }

            expect(estimateTemplate(sourceHeader, targetHeader)).toEqual(
                expectation,
            )
        })

        it('should return column_match with empty source attributes and empty primary_key when no columns could be matched by name', () => {
            const sourceHeader = ['UserName', 'Name', 'Department', 'JobTitle']
            const targetHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'City',
            ]
            const expectation = {
                column_match: [
                    { target: 'LastName', source: '' },
                    { target: 'FirstName', source: '' },
                    { target: 'MailAddress', source: '' },
                    { target: 'City', source: '' },
                ],
                primary_key: [],
            }

            expect(estimateTemplate(sourceHeader, targetHeader)).toEqual(
                expectation,
            )
        })

        it('should return column_match with empty source attributes and empty primary_key when the source header is empty', () => {
            const sourceHeader: string[] = []
            const targetHeader = [
                'LastName',
                'FirstName',
                'MailAddress',
                'City',
            ]
            const expectation = {
                column_match: [
                    { target: 'LastName', source: '' },
                    { target: 'FirstName', source: '' },
                    { target: 'MailAddress', source: '' },
                    { target: 'City', source: '' },
                ],
                primary_key: [],
            }
            expect(estimateTemplate(sourceHeader, targetHeader)).toEqual(
                expectation,
            )
        })

        it('should return empty column_match and empty primary_key when the target header is empty', () => {
            const sourceHeader = [
                'UserName',
                'FirstName',
                'LastName',
                'JobTitle',
            ]
            const targetHeader: string[] = []
            const expectation = {
                column_match: [],
                primary_key: [],
            }
            expect(estimateTemplate(sourceHeader, targetHeader)).toEqual(
                expectation,
            )
        })
    })
})
