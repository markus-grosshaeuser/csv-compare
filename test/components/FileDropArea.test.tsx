import '../../src/config/i18n'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FileDropArea, {
    type FileFormat,
} from '../../src/components/FileDropArea'
import type { FileEntry } from '../../src/redux/fileSlice'
import * as React from 'react'

describe('File: FileDropArea.tsx', () => {
    const emptyFileEntry: FileEntry = {
        name: '',
        objectUrl: '',
    }

    const selectedFileEntry: FileEntry = {
        name: 'source.csv',
        objectUrl: 'blob:source',
    }

    const csvFileFormat: FileFormat = {
        suffix: '.csv',
        mimeTypes: ['text/csv', 'application/vnd.ms-excel'],
    }

    const jsonFileFormat: FileFormat = {
        suffix: '.json',
        mimeTypes: ['application/json', 'text/json'],
    }

    const renderFileDropArea = ({
        fileEntry = emptyFileEntry,
        onFileSelectedCallback = vi.fn(),
        supportedFileFormats = [csvFileFormat],
        children = <span>Upload file</span>,
    }: {
        fileEntry?: FileEntry
        onFileSelectedCallback?: (file: File) => void
        supportedFileFormats?: FileFormat[]
        children?: React.ReactNode
    } = {}) => {
        const renderResult = render(
            <FileDropArea
                fileEntry={fileEntry}
                onFileSelectedCallback={onFileSelectedCallback}
                supportedFileFormats={supportedFileFormats}
            >
                {children}
            </FileDropArea>,
        )

        return {
            onFileSelectedCallback,
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

    it('should render an accessible drop area button', () => {
        renderFileDropArea()

        expect(
            screen.getByRole('button', {
                name: /drop file to upload or click to open file-selection-dialog/i,
            }),
        ).toBeInTheDocument()
    })

    it('should render passed children inside the drop area', () => {
        renderFileDropArea({
            children: <strong>Drop your CSV here</strong>,
        })

        expect(screen.getByText('Drop your CSV here')).toBeInTheDocument()
    })

    it('should render without children', () => {
        renderFileDropArea({
            children: null,
        })

        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be keyboard focusable', () => {
        renderFileDropArea()

        expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0')
    })

    it('should render the hidden file input', () => {
        const { container } = renderFileDropArea()

        const input = container.querySelector('input[type="file"]')

        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('hidden')
    })

    it('should set the file input accept attribute from supported MIME types', () => {
        const { container } = renderFileDropArea({
            supportedFileFormats: [csvFileFormat, jsonFileFormat],
        })

        const input = container.querySelector('input[type="file"]')

        expect(input).toHaveAttribute(
            'accept',
            'text/csv,application/vnd.ms-excel,application/json,text/json',
        )
    })

    it('should render the empty state when no file URL is present', () => {
        renderFileDropArea({
            fileEntry: emptyFileEntry,
        })

        expect(screen.getByRole('button')).toHaveAttribute(
            'data-state',
            'empty',
        )
    })

    it('should render the full state when a file URL is present', () => {
        renderFileDropArea({
            fileEntry: selectedFileEntry,
        })

        expect(screen.getByRole('button')).toHaveAttribute('data-state', 'full')
    })

    it('should switch to dragging state on drag enter', () => {
        renderFileDropArea()

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'dragging')
    })

    it('should return from dragging state to empty state on drag exit when no file is selected', () => {
        renderFileDropArea({
            fileEntry: emptyFileEntry,
        })

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'dragging')

        fireEvent.dragExit(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'empty')
    })

    it('should return from dragging state to full state on drag exit when a file is selected', () => {
        renderFileDropArea({
            fileEntry: selectedFileEntry,
        })

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'dragging')

        fireEvent.dragExit(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'full')
    })

    it('should handle drag over without changing the current empty state', () => {
        renderFileDropArea({
            fileEntry: emptyFileEntry,
        })

        const dropArea = screen.getByRole('button')

        fireEvent.dragOver(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'empty')
    })

    it('should open the hidden file input when the drop area is clicked', () => {
        const { container } = renderFileDropArea()

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.click(dropArea)

        expect(clickSpy).toHaveBeenCalled()
    })

    it('should open the hidden file input when Enter is pressed', () => {
        const { container } = renderFileDropArea()

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.keyDown(dropArea, {
            key: 'Enter',
        })

        expect(clickSpy).toHaveBeenCalled()
    })

    it('should open the hidden file input when Space is pressed', () => {
        const { container } = renderFileDropArea()

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.keyDown(dropArea, {
            key: ' ',
        })

        expect(clickSpy).toHaveBeenCalled()
    })

    it('should not open the hidden file input for unrelated keyboard keys', () => {
        const { container } = renderFileDropArea()

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.keyDown(dropArea, {
            key: 'Escape',
        })

        expect(clickSpy).not.toHaveBeenCalled()
    })

    it('should call the callback when a file is selected through the file input', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })

        const { container } = renderFileDropArea({
            onFileSelectedCallback,
        })

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: {
                files: [file],
            },
        })

        expect(onFileSelectedCallback).toHaveBeenCalledTimes(1)
        expect(onFileSelectedCallback).toHaveBeenCalledWith(file)
    })

    it('should not call the callback when the file input has no files', () => {
        const onFileSelectedCallback = vi.fn()

        const { container } = renderFileDropArea({
            onFileSelectedCallback,
        })

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: {
                files: [],
            },
        })

        expect(onFileSelectedCallback).not.toHaveBeenCalled()
    })

    function acceptCorrectFile(
        file: File,
        onFileSelectedCallback: (file: File) => void,
    ) {
        renderFileDropArea({
            onFileSelectedCallback,
            supportedFileFormats: [csvFileFormat],
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onFileSelectedCallback).toHaveBeenCalledTimes(1)
        expect(onFileSelectedCallback).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    }

    it('should accept a dropped file by matching file suffix', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/plain',
        })
        acceptCorrectFile(file, onFileSelectedCallback)
    })

    it('should accept a dropped file by matching MIME type', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.txt', {
            type: 'text/csv',
        })
        acceptCorrectFile(file, onFileSelectedCallback)
    })

    it('should accept dropped files with uppercase extensions', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'SOURCE.CSV', {
            type: 'text/plain',
        })
        acceptCorrectFile(file, onFileSelectedCallback)
    })

    it('should accept dropped files when one of multiple formats matches', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['{"name":"Template"}'], 'template.json', {
            type: 'application/json',
        })

        renderFileDropArea({
            onFileSelectedCallback,
            supportedFileFormats: [csvFileFormat, jsonFileFormat],
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onFileSelectedCallback).toHaveBeenCalledTimes(1)
        expect(onFileSelectedCallback).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should reject a dropped file when neither suffix nor MIME type is supported', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['not supported'], 'notes.txt', {
            type: 'text/plain',
        })

        renderFileDropArea({
            onFileSelectedCallback,
            supportedFileFormats: [csvFileFormat],
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onFileSelectedCallback).not.toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledTimes(1)
        expect(window.alert).toHaveBeenCalledWith(
            'Invalid file type. Please select a CSV file.',
        )
    })

    it('should do nothing when a drop event contains no files', () => {
        const onFileSelectedCallback = vi.fn()

        renderFileDropArea({
            onFileSelectedCallback,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [],
            },
        })

        expect(onFileSelectedCallback).not.toHaveBeenCalled()
        expect(window.alert).not.toHaveBeenCalled()
    })

    function draggingStateShouldBeReset(
        file: File,
        onFileSelectedCallback: (file: File) => void,
    ) {
        renderFileDropArea({
            fileEntry: emptyFileEntry,
            onFileSelectedCallback,
        })

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'dragging')

        fireEvent.drop(dropArea, {
            dataTransfer: {
                files: [file],
            },
        })

        expect(dropArea).toHaveAttribute('data-state', 'empty')
    }

    it('should reset dragging state after a supported file is dropped', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['id,name\n1,Ada'], 'source.csv', {
            type: 'text/csv',
        })
        draggingStateShouldBeReset(file, onFileSelectedCallback)
        expect(onFileSelectedCallback).toHaveBeenCalledWith(file)
    })

    it('should reset dragging state after an unsupported file is dropped', () => {
        const onFileSelectedCallback = vi.fn()
        const file = new File(['not supported'], 'notes.txt', {
            type: 'text/plain',
        })
        draggingStateShouldBeReset(file, onFileSelectedCallback)
        expect(onFileSelectedCallback).not.toHaveBeenCalled()
    })

    it('should use only the first dropped file', () => {
        const onFileSelectedCallback = vi.fn()
        const firstFile = new File(['id,name\n1,Ada'], 'first.csv', {
            type: 'text/csv',
        })
        const secondFile = new File(['id,name\n2,Grace'], 'second.csv', {
            type: 'text/csv',
        })

        renderFileDropArea({
            onFileSelectedCallback,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [firstFile, secondFile],
            },
        })

        expect(onFileSelectedCallback).toHaveBeenCalledTimes(1)
        expect(onFileSelectedCallback).toHaveBeenCalledWith(firstFile)
    })
})
