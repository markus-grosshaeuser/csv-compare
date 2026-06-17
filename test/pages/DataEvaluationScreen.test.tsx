import '../../src/config/i18n'

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataEvaluationScreen from '../../src/pages/DataEvaluationScreen.tsx'
import { parseFileHeader, processFiles } from '../../src/utilities/CsvParser'
import { provideFileDownload } from '../../src/utilities/FileDownloadProvider'
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
    processFiles: vi.fn(),
    parseFileHeader: vi.fn(),
}))

vi.mock('../../src/utilities/FileDownloadProvider', () => ({
    provideFileDownload: vi.fn(),
}))

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

function renderScreenWithFiles() {
    return renderWithProviders(<DataEvaluationScreen />, {
        preloadedState: preloadedStateWithFiles,
    })
}

function mockHeaders() {
    vi.mocked(parseFileHeader)
        .mockResolvedValueOnce(['FirstName', 'LastName', 'Email'])
        .mockResolvedValueOnce(['FirstName', 'Surname', 'EmailAddress'])
}

describe('DataEvaluationScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(parseFileHeader).mockResolvedValue(['FirstName', 'LastName'])
        vi.mocked(processFiles).mockResolvedValue(['insertions', 'deletions'])
    })

    afterEach(() => {
        cleanup()
    })

    it('should parse source and target files and renders insertions and deletions', async () => {
        mockHeaders()

        vi.mocked(processFiles).mockResolvedValue([
            'insert-id,insert-name\n1,Ada',
            'delete-id,delete-name\n2,Bob',
        ])

        renderScreenWithFiles()

        expect(
            screen.getByRole('status', { name: /loading data/i }),
        ).toBeInTheDocument()

        expect(processFiles).toHaveBeenCalledTimes(1)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })

        const insertionsTextArea = screen.getByTestId('insertions-textarea')
        const deletionsTextArea = screen.getByTestId('deletions-textarea')
        expect(insertionsTextArea).toBeInTheDocument()
        expect(deletionsTextArea).toBeInTheDocument()

        expect(insertionsTextArea).toHaveValue('insert-id,insert-name\n1,Ada')
        expect(deletionsTextArea).toHaveValue('delete-id,delete-name\n2,Bob')

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should disable download buttons while no generated content is available', () => {
        vi.mocked(processFiles).mockImplementation(() => new Promise(() => {}))

        renderScreenWithFiles()

        const downloadButtons = screen.getAllByRole('button')

        expect(downloadButtons).toHaveLength(2)
        expect(downloadButtons[0]).toBeDisabled()
        expect(downloadButtons[1]).toBeDisabled()
    })

    it('should download generated insertion and deletion CSV content', async () => {
        vi.mocked(processFiles).mockResolvedValue([
            'insertions csv',
            'deletions csv',
        ])

        renderScreenWithFiles()

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })

        const downloadButtons = screen.getAllByRole('button')

        expect(downloadButtons[0]).toBeEnabled()
        expect(downloadButtons[1]).toBeEnabled()

        fireEvent.click(downloadButtons[0])
        fireEvent.click(downloadButtons[1])

        expect(provideFileDownload).toHaveBeenCalledTimes(2)
        expect(provideFileDownload).toHaveBeenNthCalledWith(
            1,
            'insertions csv',
            'insert_into_cloud.csv',
        )
        expect(provideFileDownload).toHaveBeenNthCalledWith(
            2,
            'deletions csv',
            'suspend_from_cloud.csv',
        )
    })

    it('should show an error message and clear generated content when parsing fails', async () => {
        vi.mocked(processFiles).mockRejectedValue(new Error('Parse failed'))

        renderScreenWithFiles()

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Error parsing files. Check congruence of files and template.',
        )

        const textAreas = screen.getAllByRole('textbox')
        expect(textAreas[0]).toHaveValue('')
        expect(textAreas[1]).toHaveValue('')

        const downloadButtons = screen.getAllByRole('button')
        expect(downloadButtons[0]).toBeDisabled()
        expect(downloadButtons[1]).toBeDisabled()
    })

    it('should render localized section headings and download tooltips', async () => {
        vi.mocked(processFiles).mockResolvedValue(['insertions', 'deletions'])

        renderScreenWithFiles()

        expect(screen.getByText('Create new in Cloud:')).toBeInTheDocument()
        expect(screen.getByText('Remove from Cloud:')).toBeInTheDocument()
        expect(screen.getAllByText('Download as CSV')).toHaveLength(2)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })
    })
})
