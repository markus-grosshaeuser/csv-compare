import {
    useRef,
    useState,
    type MouseEvent,
    type DragEvent,
    type ChangeEvent,
} from 'react'
import * as React from 'react'
import Style from './FileDropArea.module.css'
import type { FileEntry } from '../redux/fileSlice.ts'
import { useTranslation } from 'react-i18next'

type FileDropAreaProps = {
    children?: React.ReactNode | null
    fileEntry: FileEntry
    setter: (file: File) => void
}

export default function FileDropArea({
    children,
    fileEntry,
    setter,
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
            setter(e.target.files[0])
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
            file.name.toLowerCase().endsWith('.csv') ||
            file.type === 'text/csv' ||
            file.type === 'application/vnd.ms-excel'
        ) {
            setter(file)
        } else {
            alert('Invalid file type. Please select a CSV file.')
        }
    }

    function handleDragExit() {
        setIsDragging(false)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
        }
    }

    return (
        <div
            className={
                Style.FileDropArea +
                ' ' +
                (fileURL ? Style.FileDropAreaFull : Style.FileDropAreaEmpty) +
                ' ' +
                (isDragging ? Style.FileDropAreaDragging : '')
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
                accept=".csv"
                ref={inputRef}
                onChange={(e) => handleFileChange(e)}
            />
        </div>
    )
}
