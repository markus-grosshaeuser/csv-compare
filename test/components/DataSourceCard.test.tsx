import '../../src/config/i18n'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataSourceCard from '../../src/components/DataSourceCard'
import type { FileEntry } from '../../src/redux/fileSlice'

describe('File: DataSourceCard.tsx', () => {
    const config = {
        icon: '/img/source-system.svg',
        name: 'Example System',
    }

    const emptyFile: FileEntry = {
        name: '',
        objectUrl: '',
    }

    const selectedFile: FileEntry = {
        name: 'source.csv',
        objectUrl: 'blob:source',
    }

    const csvFileFormats = [
        {
            suffix: '.csv',
            mimeTypes: ['text/csv', 'application/vnd.ms-excel'],
        },
    ]

    const renderDataSourceCard = ({
        titleTranslationKey = 'source_system',
        file = emptyFile,
        setter = vi.fn(),
        fileFormats = csvFileFormats,
    }: {
        titleTranslationKey?: string
        file?: FileEntry
        setter?: (file: File) => void
        fileFormats?: { suffix: string; mimeTypes: string[] }[]
    } = {}) => {
        const renderResult = render(
            <DataSourceCard
                titleTranslationKey={titleTranslationKey}
                config={config}
                file={file}
                setter={setter}
                fileFormats={fileFormats}
            />,
        )

        return {
            setter,
            ...renderResult,
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('should render the translated title and configured datasource name', () => {
        renderDataSourceCard()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Source System: Example System',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Example System')).toBeInTheDocument()
    })

    it('should render another translated title when a different translation key is passed', () => {
        renderDataSourceCard({
            titleTranslationKey: 'target_system',
        })

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Target System: Example System',
            }),
        ).toBeInTheDocument()
    })

    it('should show the no-file-selected text when no file is selected', () => {
        renderDataSourceCard({
            file: emptyFile,
        })

        expect(screen.getByText('No file selected')).toBeInTheDocument()
        expect(screen.queryByText(/File:/)).not.toBeInTheDocument()
    })

    it('should show the selected file name when a file is selected', () => {
        renderDataSourceCard({
            file: selectedFile,
        })

        expect(screen.getByText('File: source.csv')).toBeInTheDocument()
        expect(screen.queryByText('No file selected')).not.toBeInTheDocument()
    })

    it('should render the upload instructions', () => {
        renderDataSourceCard()

        expect(
            screen.getByText(
                'Drop file to upload or click to open file-selection-dialog',
            ),
        ).toBeInTheDocument()
    })

    it('should render the configured icon inside the drop area as decorative content', () => {
        const { container } = renderDataSourceCard()

        const icon = container.querySelector('img')

        expect(icon).toBeInTheDocument()
        expect(icon).toHaveAttribute('src', config.icon)
        expect(icon).toHaveAttribute('alt', '')
        expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should render an accessible file drop area', () => {
        renderDataSourceCard()

        expect(
            screen.getByRole('button', {
                name: /drop file to upload or click to open file-selection-dialog/i,
            }),
        ).toBeInTheDocument()
    })

    it('should pass an empty file entry to FileDropArea so it renders the empty state', () => {
        renderDataSourceCard({
            file: emptyFile,
        })

        expect(screen.getByRole('button')).toHaveAttribute(
            'data-state',
            'empty',
        )
    })

    it('should pass a selected file entry to FileDropArea so it renders the full state', () => {
        renderDataSourceCard({
            file: selectedFile,
        })

        expect(screen.getByRole('button')).toHaveAttribute('data-state', 'full')
    })

    it('should call the setter when a supported file is selected through the hidden file input', () => {
        const setter = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })

        const { container } = renderDataSourceCard({
            setter,
        })

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: { files: [file] },
        })

        expect(setter).toHaveBeenCalledTimes(1)
        expect(setter).toHaveBeenCalledWith(file)
    })

    it('should call the setter when a supported file is dropped onto the drop area', () => {
        const setter = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })

        renderDataSourceCard({
            setter,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(setter).toHaveBeenCalledTimes(1)
        expect(setter).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should pass supported file formats to FileDropArea and reject unsupported files', () => {
        const setter = vi.fn()
        const file = new File(['not csv'], 'source.txt', {
            type: 'text/plain',
        })

        renderDataSourceCard({
            setter,
            fileFormats: csvFileFormats,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(setter).not.toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith(
            'Invalid file type. Please select a CSV file.',
        )
    })
})
