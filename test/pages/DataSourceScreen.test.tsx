import '../../src/config/i18n'

import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataSourceScreen from '../../src/pages/DataSourceScreen'
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

describe('DataSourceScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        vi.stubGlobal(
            'URL',
            Object.assign(URL, {
                createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
                revokeObjectURL: vi.fn(),
            }),
        )
    })

    afterEach(() => {
        cleanup()
    })

    it('should render both data source cards with empty file state', () => {
        renderWithProviders(<DataSourceScreen />)

        expect(screen.getByText('Database')).toBeInTheDocument()
        expect(screen.getByText('Cloud')).toBeInTheDocument()
        expect(screen.getAllByText('No file selected')).toHaveLength(2)
        expect(screen.getByTestId('evaluation_button')).not.toBeVisible()
    })

    it('should keep the continue button hidden until both files are selected', () => {
        renderWithProviders(<DataSourceScreen />)

        const sourceFile = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })

        const sourceDropArea = screen.getAllByRole('button', {
            name: /drop file to upload/i,
        })[0]

        fireEvent.drop(sourceDropArea, {
            dataTransfer: {
                files: [sourceFile],
            },
        })

        expect(screen.getByText('File: source.csv')).toBeInTheDocument()
        expect(screen.getByTestId('evaluation_button')).not.toBeVisible()
        expect(navigateMock).not.toHaveBeenCalled()
    })

    it('should store selected source and destination files and enables navigation', () => {
        renderWithProviders(<DataSourceScreen />)

        const sourceFile = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })
        const destinationFile = new File(
            ['id,name\n2,Bob'],
            'destination.csv',
            {
                type: 'text/csv',
            },
        )

        const dropAreas = screen.getAllByRole('button', {
            name: /drop file to upload/i,
        })

        fireEvent.drop(dropAreas[0], {
            dataTransfer: {
                files: [sourceFile],
            },
        })
        fireEvent.drop(dropAreas[1], {
            dataTransfer: {
                files: [destinationFile],
            },
        })

        expect(screen.getByText('File: source.csv')).toBeInTheDocument()
        expect(screen.getByText('File: destination.csv')).toBeInTheDocument()

        const continueButton = screen.getByTestId('evaluation_button')

        expect(continueButton).toBeEnabled()

        fireEvent.click(continueButton)

        expect(navigateMock).toHaveBeenCalledTimes(1)
        expect(navigateMock).toHaveBeenCalledWith('/evaluation')
    })

    it('should revoke the previous object URL when replacing files', () => {
        renderWithProviders(<DataSourceScreen />, {
            preloadedState: {
                file: {
                    value: {
                        source: {
                            name: 'old-source.csv',
                            objectUrl: 'blob:old-source',
                        },
                        destination: {
                            name: 'old-destination.csv',
                            objectUrl: 'blob:old-destination',
                        },
                    },
                },
            },
        })

        const newSourceFile = new File(['new'], 'new-source.csv', {
            type: 'text/csv',
        })
        const newDestinationFile = new File(['new'], 'new-destination.csv', {
            type: 'text/csv',
        })

        const dropAreas = screen.getAllByRole('button', {
            name: /drop file to upload/i,
        })

        fireEvent.drop(dropAreas[0], {
            dataTransfer: {
                files: [newSourceFile],
            },
        })
        fireEvent.drop(dropAreas[1], {
            dataTransfer: {
                files: [newDestinationFile],
            },
        })

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old-source')
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old-destination')
        expect(screen.getByText('File: new-source.csv')).toBeInTheDocument()
        expect(
            screen.getByText('File: new-destination.csv'),
        ).toBeInTheDocument()
    })

    it('should not navigate when the continue button is disabled', () => {
        renderWithProviders(<DataSourceScreen />)

        fireEvent.click(
            screen.getByTestId('evaluation_button'),
        )

        expect(navigateMock).not.toHaveBeenCalled()
    })
})
