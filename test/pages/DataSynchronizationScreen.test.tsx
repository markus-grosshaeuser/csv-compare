import '../../src/config/i18n'

import {
    cleanup,
    fireEvent,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataSynchronizationScreen from '../../src/pages/DataSynchronizationScreen.tsx'
import { parseFileHeader } from '../../src/utilities/CsvParser'
import {
    findMatchingTemplates,
    loadTemplateFromFile,
    loadTemplateFromURL,
    verifyTemplateFileDataFormat,
} from '../../src/utilities/TemplateLoader'
import estimateTemplate from '../../src/utilities/TemplateEstimator'
import { renderWithProviders } from '../RenderWIthProvider'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<typeof import('react-router-dom')>(
            'react-router-dom',
        )

    return {
        ...actual,
        useNavigate: () => navigateMock,
    }
})

vi.mock('../../src/utilities/CsvParser', () => ({
    parseFileHeader: vi.fn(),
}))

vi.mock('../../src/utilities/TemplateLoader', () => ({
    findMatchingTemplates: vi.fn(),
    loadTemplateFromFile: vi.fn(),
    loadTemplateFromURL: vi.fn(),
    verifyTemplateFileDataFormat: vi.fn(),
}))

vi.mock('../../src/utilities/TemplateEstimator', () => ({
    default: vi.fn(),
}))

const predefinedTemplate = {
    name: 'Default Template',
    path: '/templates/default-template.json',
}

const secondPredefinedTemplate = {
    name: 'Second Template',
    path: '/templates/second-template.json',
}

const defaultTemplate = {
    primary_key: [{ target: 'EmailAddress', source: 'Email' }],
    column_match: [
        { target: 'FirstName', source: 'FirstName' },
        { target: 'Surname', source: 'LastName' },
        { target: 'EmailAddress', source: 'Email' },
    ],
}

const secondTemplate = {
    primary_key: [{ target: 'Surname', source: 'LastName' }],
    column_match: [
        { target: 'FirstName', source: 'FirstName' },
        { target: 'Surname', source: 'LastName' },
        { target: 'EmailAddress', source: 'Email' },
    ],
}

const uploadedTemplate = {
    primary_key: [{ target: 'FirstName', source: 'FirstName' }],
    column_match: [
        { target: 'FirstName', source: 'FirstName' },
        { target: 'Surname', source: 'LastName' },
        { target: 'EmailAddress', source: 'Email' },
    ],
}

const estimatedTemplate = {
    primary_key: [],
    column_match: [
        { target: 'FirstName', source: 'FirstName' },
        { target: 'Surname', source: '' },
        { target: 'EmailAddress', source: 'Email' },
    ],
}

const preloadedStateWithFiles = {
    file: {
        value: {
            source: {
                name: 'source.csv',
                objectUrl: 'blob:source',
            },
            target: {
                name: 'target.csv',
                objectUrl: 'blob:target',
            },
        },
    },
}

function mockHeaders() {
    vi.mocked(parseFileHeader)
        .mockResolvedValueOnce(['FirstName', 'LastName', 'Email'])
        .mockResolvedValueOnce(['FirstName', 'Surname', 'EmailAddress'])
}

function renderScreenWithFiles() {
    return renderWithProviders(<DataSynchronizationScreen />, {
        preloadedState: preloadedStateWithFiles,
    })
}

describe('DataSynchronizationScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        vi.mocked(verifyTemplateFileDataFormat).mockReturnValue(true)
        vi.mocked(findMatchingTemplates).mockResolvedValue([predefinedTemplate])
        vi.mocked(loadTemplateFromURL).mockResolvedValue(defaultTemplate)
        vi.mocked(loadTemplateFromFile).mockResolvedValue(uploadedTemplate)
        vi.mocked(estimateTemplate).mockReturnValue(estimatedTemplate)
    })

    afterEach(() => {
        cleanup()
    })

    it('should read uploaded file URLs from Redux, parse headers and initialize the store from a predefined template', async () => {
        mockHeaders()

        const { store } = renderScreenWithFiles()

        await waitFor(() => {
            expect(parseFileHeader).toHaveBeenCalledTimes(2)
        })

        expect(parseFileHeader).toHaveBeenNthCalledWith(1, 'blob:source')
        expect(parseFileHeader).toHaveBeenNthCalledWith(2, 'blob:target')

        expect(findMatchingTemplates).toHaveBeenCalledWith(
            ['FirstName', 'LastName', 'Email'],
            ['FirstName', 'Surname', 'EmailAddress'],
        )

        expect(loadTemplateFromURL).toHaveBeenCalledWith(
            '/templates/default-template.json',
        )

        await waitFor(() => {
            expect(store.getState().csvHeader.value).toEqual({
                sourceHeader: ['FirstName', 'LastName', 'Email'],
                targetHeader: ['FirstName', 'Surname', 'EmailAddress'],
            })
        })

        expect(store.getState().template.value).toEqual(defaultTemplate)
    })

    it('should render target columns and source column selectors from Redux-backed state', async () => {
        mockHeaders()

        renderScreenWithFiles()

        expect(await screen.findAllByText('FirstName')).not.toHaveLength(0)

        const selects = screen.getAllByRole('combobox')

        const firstNameMappingSelect = selects[1]
        expect(
            within(firstNameMappingSelect).getByRole('option', {
                name: 'FirstName',
            }),
        ).toBeInTheDocument()
        expect(
            within(firstNameMappingSelect).getByRole('option', {
                name: 'LastName',
            }),
        ).toBeInTheDocument()
        expect(
            within(firstNameMappingSelect).getByRole('option', {
                name: 'Email',
            }),
        ).toBeInTheDocument()

        expect(firstNameMappingSelect).toHaveValue('FirstName')
    })

    it('should load another predefined template when the predefined-template dropdown changes', async () => {
        mockHeaders()

        vi.mocked(findMatchingTemplates).mockResolvedValue([
            secondPredefinedTemplate,
            predefinedTemplate,
        ])

        vi.mocked(loadTemplateFromURL)
            .mockResolvedValueOnce(defaultTemplate)
            .mockResolvedValueOnce(secondTemplate)

        const { store } = renderScreenWithFiles()

        await screen.findByText('Default Template')

        const templateSelector = screen.getAllByRole('combobox')[0]

        expect(templateSelector).toHaveValue('Default Template')

        fireEvent.change(templateSelector, {
            target: {
                value: 'Second Template',
            },
        })

        await waitFor(() => {
            expect(loadTemplateFromURL).toHaveBeenLastCalledWith(
                '/templates/second-template.json',
            )
        })

        await waitFor(() => {
            expect(store.getState().template.value).toEqual(secondTemplate)
        })

        expect(templateSelector).toHaveValue('Second Template')
    })

    it('should load and apply a JSON template selected through the file input', async () => {
        mockHeaders()

        const { container, store } = renderScreenWithFiles()

        await screen.findAllByText('FirstName')

        const file = new File(
            [JSON.stringify(uploadedTemplate)],
            'template.json',
            {
                type: 'application/json',
            },
        )

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: {
                files: [file],
            },
        })

        await waitFor(() => {
            expect(loadTemplateFromFile).toHaveBeenCalledWith(file)
        })

        await waitFor(() => {
            expect(store.getState().template.value).toEqual(uploadedTemplate)
        })
    })

    it('should estimate a template when no matching predefined template exists', async () => {
        mockHeaders()

        vi.mocked(findMatchingTemplates).mockResolvedValue([])

        const { store } = renderScreenWithFiles()

        await waitFor(() => {
            expect(estimateTemplate).toHaveBeenCalledWith(
                ['FirstName', 'LastName', 'Email'],
                ['FirstName', 'Surname', 'EmailAddress'],
            )
        })

        expect(loadTemplateFromURL).not.toHaveBeenCalled()

        await waitFor(() => {
            expect(store.getState().template.value).toEqual(estimatedTemplate)
        })
    })

    it('should navigate back to the data-source screen when required file URLs are missing', async () => {
        renderWithProviders(<DataSynchronizationScreen />, {
            preloadedState: {
                file: {
                    value: {
                        source: {
                            name: '',
                            objectUrl: '',
                        },
                        target: {
                            name: '',
                            objectUrl: '',
                        },
                    },
                },
            },
        })

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith('/')
        })

        expect(parseFileHeader).not.toHaveBeenCalled()
    })

    it('should navigate to the evaluation screen when the continue button is clicked', async () => {
        mockHeaders()

        renderScreenWithFiles()

        const continueButton = await screen.findByRole('button', {
            name: 'Continue to evaluation',
        })

        fireEvent.click(continueButton)

        expect(navigateMock).toHaveBeenCalledWith('/evaluation')
    })

    it('should navigate to the evaluation screen when the continue button is clicked', async () => {
        mockHeaders()

        renderScreenWithFiles()

        const continueButton = await screen.findByRole('button', {
            name: 'Continue to evaluation',
        })

        fireEvent.click(continueButton)

        expect(navigateMock).toHaveBeenCalledWith('/evaluation')
    })

    it('should show an error message when initialization fails', async () => {
        vi.mocked(parseFileHeader).mockRejectedValueOnce(
            new Error('Unable to parse header'),
        )

        renderScreenWithFiles()

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Error parsing files. Check congruence of files and template.',
        )

        await waitFor(() => {
            expect(
                screen.queryByRole('status', {
                    name: 'Loading data...',
                }),
            ).not.toBeInTheDocument()
        })
    })

    it('should ignore an invalid uploaded template file', async () => {
        mockHeaders()

        vi.mocked(verifyTemplateFileDataFormat)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)

        const { container, store } = renderScreenWithFiles()

        await screen.findAllByText('FirstName')

        const file = new File(
            [JSON.stringify(uploadedTemplate)],
            'template.json',
            {
                type: 'application/json',
            },
        )

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: {
                files: [file],
            },
        })

        await waitFor(() => {
            expect(loadTemplateFromFile).toHaveBeenCalledWith(file)
        })

        expect(store.getState().template.value).toEqual(defaultTemplate)
    })

    it('should ignore an invalid predefined template selection', async () => {
        mockHeaders()

        vi.mocked(findMatchingTemplates).mockResolvedValue([
            predefinedTemplate,
            secondPredefinedTemplate,
        ])

        vi.mocked(loadTemplateFromURL)
            .mockResolvedValueOnce(defaultTemplate)
            .mockResolvedValueOnce(secondTemplate)

        vi.mocked(verifyTemplateFileDataFormat)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)

        const { store } = renderScreenWithFiles()

        await screen.findByText('Default Template')

        const templateSelector = screen.getAllByRole('combobox')[0]

        fireEvent.change(templateSelector, {
            target: {
                value: 'Second Template',
            },
        })

        await waitFor(() => {
            expect(loadTemplateFromURL).toHaveBeenLastCalledWith(
                '/templates/second-template.json',
            )
        })

        expect(store.getState().template.value).toEqual(defaultTemplate)
        expect(templateSelector).toHaveValue('Default Template')
    })

    it('should build the template from changed primary-key and column mappings before continuing', async () => {
        mockHeaders()

        const { store } = renderScreenWithFiles()

        const continueButton = await screen.findByRole('button', {
            name: 'Continue to evaluation',
        })

        const primaryKeyCheckboxes = screen.getAllByRole('checkbox')
        const mappingSelectComboboxes = screen.getAllByRole('combobox')

        await waitFor(() => {
            fireEvent.click(primaryKeyCheckboxes[0])
            fireEvent.click(primaryKeyCheckboxes[1])
            fireEvent.click(primaryKeyCheckboxes[2])

            fireEvent.change(mappingSelectComboboxes[1], {
                target: {
                    value: 'LastName',
                },
            })
            fireEvent.change(mappingSelectComboboxes[2], {
                target: {
                    value: 'FirstName',
                },
            })
        })

        await waitFor(() => {
            fireEvent.click(continueButton)
        })

        expect(store.getState().template.value).toEqual({
            primary_key: [
                {
                    target: 'FirstName',
                    source: 'LastName',
                },
                {
                    target: 'Surname',
                    source: 'FirstName',
                },
            ],
            column_match: [
                {
                    target: 'FirstName',
                    source: 'LastName',
                },
                {
                    target: 'Surname',
                    source: 'FirstName',
                },
                {
                    target: 'EmailAddress',
                    source: 'Email',
                },
            ],
        })

        expect(navigateMock).toHaveBeenCalledWith('/evaluation')
    })

    it('should navigate back to the data-source screen when the back button is clicked', async () => {
        mockHeaders()

        renderScreenWithFiles()

        const backButton = await screen.findByRole('button', {
            name: 'Return to previous screen',
        })

        fireEvent.click(backButton)

        expect(navigateMock).toHaveBeenCalledWith('/')
    })
})
