import '../../src/config/i18n'

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataSynchronizationScreen from '../../src/pages/DataSynchronizationScreen'
import { performParse } from '../../src/utilities/CsvParser'
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
    performParse: vi.fn(),
}))

vi.mock('../../src/utilities/FileDownloadProvider', () => ({
    provideFileDownload: vi.fn(),
}))

const renderScreenWithFiles = () =>
    renderWithProviders(<DataSynchronizationScreen />, {
        preloadedState: {
            file: {
                value: {
                    source: {
                        name: 'source.csv',
                        objectUrl: 'blob:source',
                    },
                    destination: {
                        name: 'destination.csv',
                        objectUrl: 'blob:destination',
                    },
                },
            },
        },
    })

describe('DataSynchronizationScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('should redirect to the start page when required file URLs are missing', () => {
        renderWithProviders(<DataSynchronizationScreen />)

        expect(navigateMock).toHaveBeenCalledTimes(1)
        expect(navigateMock).toHaveBeenCalledWith('/')
        expect(performParse).not.toHaveBeenCalled()
    })

    it('should parse source and destination files and renders insertions and deletions', async () => {
        vi.mocked(performParse).mockResolvedValue([
            'insert-id,insert-name\n1,Ada',
            'delete-id,delete-name\n2,Bob',
        ])

        renderScreenWithFiles()

        expect(
            screen.getByRole('status', { name: /loading data/i }),
        ).toBeInTheDocument()

        expect(performParse).toHaveBeenCalledTimes(1)
        expect(performParse).toHaveBeenCalledWith(
            'blob:source',
            'blob:destination',
        )

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
        vi.mocked(performParse).mockImplementation(() => new Promise(() => {}))

        renderScreenWithFiles()

        const downloadButtons = screen.getAllByRole('button')

        expect(downloadButtons).toHaveLength(2)
        expect(downloadButtons[0]).toBeDisabled()
        expect(downloadButtons[1]).toBeDisabled()
    })

    it('should download generated insertion and deletion CSV content', async () => {
        vi.mocked(performParse).mockResolvedValue([
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
        vi.mocked(performParse).mockRejectedValue(new Error('Parse failed'))

        renderScreenWithFiles()

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Error parsing files. Check congruence of files and template.',
        )

        const textareas = screen.getAllByRole('textbox')
        expect(textareas[0]).toHaveValue('')
        expect(textareas[1]).toHaveValue('')

        const downloadButtons = screen.getAllByRole('button')
        expect(downloadButtons[0]).toBeDisabled()
        expect(downloadButtons[1]).toBeDisabled()
    })

    it('should render localized section headings and download tooltips', async () => {
        vi.mocked(performParse).mockResolvedValue(['insertions', 'deletions'])

        renderScreenWithFiles()

        expect(screen.getByText('Create new in Cloud:')).toBeInTheDocument()
        expect(screen.getByText('Remove from Cloud:')).toBeInTheDocument()
        expect(screen.getAllByText('Download as CSV')).toHaveLength(2)

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument()
        })
    })
})
