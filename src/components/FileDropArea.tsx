import {
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import type { FileEntry } from '../redux/fileSlice.ts'
import Style from './FileDropArea.module.css'

export type FileFormat = {
    suffix: string
    mimeTypes: string[]
}

type FileDropAreaProps = {
    children?: ReactNode | null
    fileEntry: FileEntry
    onFileSelectedCallback: (file: File) => void
    supportedFileFormats: FileFormat[]
}

export default function FileDropArea({
    children,
    fileEntry,
    onFileSelectedCallback,
    supportedFileFormats,
}: FileDropAreaProps) {
    const fileURL: string = fileEntry.objectUrl

    const [isDragging, setIsDragging] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const { t } = useTranslation()

    function handleClick(e: MouseEvent<HTMLDivElement>) {
        e.stopPropagation()
        inputRef.current?.click()
    }

    function handleFileChange(
        e: ChangeEvent<HTMLInputElement, HTMLInputElement>,
    ) {
        if (e.target.files !== null && e.target.files.length > 0) {
            onFileSelectedCallback(e.target.files[0])
        }
    }

    function handleDragEnter() {
        setIsDragging(true)
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault()
        e.stopPropagation()
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer.files[0]
        setIsDragging(false)
        if (!file) {
            return
        }
        if (
            supportedFileFormats.some(
                (format) =>
                    file.name
                        .toLowerCase()
                        .endsWith(format.suffix.toLowerCase()) ||
                    format.mimeTypes.includes(file.type),
            )
        ) {
            onFileSelectedCallback(file)
        } else {
            alert('Invalid file type. Please select a CSV file.')
        }
    }

    function handleDragExit() {
        setIsDragging(false)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
        }
    }

    return (
        <div
            className={
                Style.fileDropArea +
                ' ' +
                (fileURL ? Style.fileDropAreaFull : Style.fileDropAreaEmpty) +
                ' ' +
                (isDragging ? Style.fileDropAreaDragging : '')
            }
            data-state={isDragging ? 'dragging' : fileURL ? 'full' : 'empty'}
            onClick={(e) => handleClick(e)}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => handleDragOver(e)}
            onDrop={(e) => handleDrop(e)}
            onDragExit={handleDragExit}
            onKeyDown={(e) => {
                handleKeyDown(e)
            }}
            role="button"
            tabIndex={0}
            aria-label={t('put_data_file_here')}
        >
            {children}

            <input
                hidden
                type="file"
                accept={supportedFileFormats
                    .map((format) => format.mimeTypes)
                    .join(',')}
                ref={inputRef}
                onChange={(e) => handleFileChange(e)}
            />
        </div>
    )
}
