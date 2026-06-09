import '../../src/config/i18n'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FileDropArea from '../../src/components/FileDropArea'

describe('FileDropArea', () => {
    const fileEntry = {
        name: '',
        objectUrl: '',
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    })

    afterEach(() => {
        cleanup()
    })

    it('should render children and expose an accessible drop-area', () => {
        render(
            <FileDropArea fileEntry={fileEntry} setter={vi.fn()}>
                <span>Upload CSV</span>
            </FileDropArea>,
        )

        expect(
            screen.getByRole('button', {
                name: /drop file to upload or click to open file-selection-dialog/i,
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Upload CSV')).toBeInTheDocument()
    })

    it('should use empty and dragging states correctly', () => {
        render(<FileDropArea fileEntry={fileEntry} setter={vi.fn()} />)

        const dropArea = screen.getByRole('button')
        expect(dropArea).toHaveAttribute('data-state', 'empty')

        fireEvent.dragEnter(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'dragging')

        fireEvent.dragExit(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'empty')
    })

    it('should use full state when a CSV file is already selected', () => {
        render(
            <FileDropArea
                fileEntry={{ name: 'source.csv', objectUrl: 'blob:source' }}
                setter={vi.fn()}
            />,
        )

        expect(screen.getByRole('button')).toHaveAttribute('data-state', 'full')
    })

    it('should call the setter when a CSV file is selected through the file input', () => {
        const setter = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })

        const { container } = render(
            <FileDropArea fileEntry={fileEntry} setter={setter} />,
        )

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: { files: [file] },
        })

        expect(setter).toHaveBeenCalledTimes(1)
        expect(setter).toHaveBeenCalledWith(file)
    })

    it('should open the hidden file input on mouse click, Enter and Space', () => {
        const { container } = render(
            <FileDropArea fileEntry={fileEntry} setter={vi.fn()} />,
        )

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.click(dropArea)
        expect(clickSpy).toHaveBeenCalled()
        clickSpy.mockClear()
        fireEvent.keyDown(dropArea, { key: 'Enter' })
        expect(clickSpy).toHaveBeenCalled()
        clickSpy.mockClear()
        fireEvent.keyDown(dropArea, { key: ' ' })
        expect(clickSpy).toHaveBeenCalled()
        clickSpy.mockClear()
    })

    it('should accept dropped CSV files by file extension', () => {
        const setter = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: '',
        })

        render(<FileDropArea fileEntry={fileEntry} setter={setter} />)

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(setter).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should accept dropped CSV files by MIME type', () => {
        const setter = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.txt', {
            type: 'application/vnd.ms-excel',
        })

        render(<FileDropArea fileEntry={fileEntry} setter={setter} />)

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(setter).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should reject dropped files that are not CSV files', () => {
        const setter = vi.fn()
        const file = new File(['not csv'], 'source.txt', {
            type: 'text/plain',
        })

        render(<FileDropArea fileEntry={fileEntry} setter={setter} />)

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

    it('should do nothing when a drop event contains no file', () => {
        const setter = vi.fn()

        render(<FileDropArea fileEntry={fileEntry} setter={setter} />)

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [],
            },
        })

        expect(setter).not.toHaveBeenCalled()
        expect(window.alert).not.toHaveBeenCalled()
    })
})
