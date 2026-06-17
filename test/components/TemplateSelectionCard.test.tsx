import '../../src/config/i18n'

import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TemplateSelectionCard from '../../src/components/TemplateSelectionCard'
import type { TemplateInfo } from '../../src/utilities/TemplateLoader'
import * as React from 'react'

describe('File: TemplateSelectionCard.tsx', () => {
    const predefinedTemplates: TemplateInfo[] = [
        {
            name: 'CSV Template',
            path: '/templates/csv-template.json',
        },
        {
            name: 'CRM Template',
            path: '/templates/crm-template.json',
        },
    ]

    const renderTemplateSelectionCard = ({
        selectedPredefinedTemplate = null,
        onPredefinedTemplateSelect = vi.fn(async () => undefined),
        predefinedTemplatesValue = predefinedTemplates,
        onTemplateFileSelect = vi.fn(async () => undefined),
    }: {
        selectedPredefinedTemplate?: TemplateInfo | null
        onPredefinedTemplateSelect?: (
            event: React.ChangeEvent<HTMLSelectElement>,
        ) => Promise<void>
        predefinedTemplatesValue?: TemplateInfo[]
        onTemplateFileSelect?: (file: File) => Promise<void>
    } = {}) => {
        const renderResult = render(
            <TemplateSelectionCard
                selectedPredefinedTemplate={selectedPredefinedTemplate}
                onPredefinedTemplateSelect={onPredefinedTemplateSelect}
                predefinedTemplates={predefinedTemplatesValue}
                onTemplateFileSelect={onTemplateFileSelect}
            />,
        )

        return {
            onPredefinedTemplateSelect,
            onTemplateFileSelect,
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

    it('should render the translated heading', () => {
        renderTemplateSelectionCard()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Choose template',
            }),
        ).toBeInTheDocument()
    })

    it('should render a template selector', () => {
        renderTemplateSelectionCard()

        expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render all predefined template options', () => {
        renderTemplateSelectionCard()

        const selector = screen.getByRole('combobox')

        expect(
            within(selector).getByRole('option', {
                name: 'CSV Template',
            }),
        ).toHaveValue('CSV Template')
        expect(
            within(selector).getByRole('option', {
                name: 'CRM Template',
            }),
        ).toHaveValue('CRM Template')
    })

    it('should not render predefined template options when the list is empty', () => {
        renderTemplateSelectionCard({
            predefinedTemplatesValue: [],
        })

        const selector = screen.getByRole('combobox')

        expect(
            within(selector).queryByRole('option', {
                name: 'CSV Template',
            }),
        ).not.toBeInTheDocument()
        expect(
            within(selector).queryByRole('option', {
                name: 'CRM Template',
            }),
        ).not.toBeInTheDocument()
    })

    it('should select an empty value when no predefined template is selected', () => {
        renderTemplateSelectionCard({
            selectedPredefinedTemplate: null,
        })

        expect(screen.getByRole('combobox')).toHaveValue('')
    })

    it('should select the currently selected predefined template', () => {
        renderTemplateSelectionCard({
            selectedPredefinedTemplate: predefinedTemplates[1],
        })

        expect(screen.getByRole('combobox')).toHaveValue('CRM Template')
    })

    it('should call the predefined-template selection callback when a template is selected', () => {
        const onPredefinedTemplateSelect = vi.fn(async () => undefined)

        renderTemplateSelectionCard({
            onPredefinedTemplateSelect,
        })

        fireEvent.change(screen.getByRole('combobox'), {})

        expect(onPredefinedTemplateSelect).toHaveBeenCalledTimes(1)
    })

    it('should render an accessible template file drop area', () => {
        renderTemplateSelectionCard()

        expect(
            screen.getByRole('button', {
                name: /drop file to upload or click to open file-selection-dialog/i,
            }),
        ).toBeInTheDocument()
    })

    it('should render the translated upload instructions', () => {
        renderTemplateSelectionCard()

        expect(
            screen.getByText(
                'Drop file to upload or click to open file-selection-dialog',
            ),
        ).toBeInTheDocument()
    })

    it('should render the upload icon as decorative content inside the drop area', () => {
        const { container } = renderTemplateSelectionCard()

        const image = container.querySelector('img')

        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('alt', '')
        expect(image).toHaveAttribute('aria-hidden', 'true')
    })

    it('should render the file drop area in empty state', () => {
        renderTemplateSelectionCard()

        expect(screen.getByRole('button')).toHaveAttribute(
            'data-state',
            'empty',
        )
    })

    it('should set the hidden file input to accept JSON MIME types', () => {
        const { container } = renderTemplateSelectionCard()

        const input = container.querySelector('input[type="file"]')

        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('hidden')
        expect(input).toHaveAttribute('accept', 'application/json,text/json')
    })

    it('should open the hidden file input when the drop area is clicked', () => {
        const { container } = renderTemplateSelectionCard()

        const dropArea = screen.getByRole('button')
        const input = container.querySelector('input[type="file"]')
        const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

        fireEvent.click(dropArea)

        expect(clickSpy).toHaveBeenCalled()
    })

    it('should call the template-file callback when a JSON file is selected through the file input', () => {
        const onTemplateFileSelect = vi.fn(async () => undefined)
        const file = new File(
            ['{"primary_key":[],"column_match":[]}'],
            'template.json',
            {
                type: 'application/json',
            },
        )

        const { container } = renderTemplateSelectionCard({
            onTemplateFileSelect,
        })

        const input = container.querySelector('input[type="file"]')
        expect(input).toBeInTheDocument()

        fireEvent.change(input as HTMLInputElement, {
            target: {
                files: [file],
            },
        })

        expect(onTemplateFileSelect).toHaveBeenCalledTimes(1)
        expect(onTemplateFileSelect).toHaveBeenCalledWith(file)
    })

    it('should call the template-file callback when a JSON file is dropped by matching suffix', () => {
        const onTemplateFileSelect = vi.fn(async () => undefined)
        const file = new File(
            ['{"primary_key":[],"column_match":[]}'],
            'template.json',
            {
                type: 'text/plain',
            },
        )

        renderTemplateSelectionCard({
            onTemplateFileSelect,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onTemplateFileSelect).toHaveBeenCalledTimes(1)
        expect(onTemplateFileSelect).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should call the template-file callback when a JSON file is dropped by matching MIME type', () => {
        const onTemplateFileSelect = vi.fn(async () => undefined)
        const file = new File(
            ['{"primary_key":[],"column_match":[]}'],
            'template.txt',
            {
                type: 'application/json',
            },
        )

        renderTemplateSelectionCard({
            onTemplateFileSelect,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onTemplateFileSelect).toHaveBeenCalledTimes(1)
        expect(onTemplateFileSelect).toHaveBeenCalledWith(file)
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should reject dropped files that are not JSON files', () => {
        const onTemplateFileSelect = vi.fn(async () => undefined)
        const file = new File(['not json'], 'template.txt', {
            type: 'text/plain',
        })

        renderTemplateSelectionCard({
            onTemplateFileSelect,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [file],
            },
        })

        expect(onTemplateFileSelect).not.toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledTimes(1)
        expect(window.alert).toHaveBeenCalledWith(
            'Invalid file type. Please select a CSV file.',
        )
    })

    it('should do nothing when a drop event contains no files', () => {
        const onTemplateFileSelect = vi.fn(async () => undefined)

        renderTemplateSelectionCard({
            onTemplateFileSelect,
        })

        fireEvent.drop(screen.getByRole('button'), {
            dataTransfer: {
                files: [],
            },
        })

        expect(onTemplateFileSelect).not.toHaveBeenCalled()
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('should switch the drop area into dragging state on drag enter', () => {
        renderTemplateSelectionCard()

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'dragging')
    })

    it('should return the drop area to empty state on drag exit', () => {
        renderTemplateSelectionCard()

        const dropArea = screen.getByRole('button')

        fireEvent.dragEnter(dropArea)
        expect(dropArea).toHaveAttribute('data-state', 'dragging')

        fireEvent.dragExit(dropArea)

        expect(dropArea).toHaveAttribute('data-state', 'empty')
    })

    it('should update the selected predefined template when props change', () => {
        const { rerender } = render(
            <TemplateSelectionCard
                selectedPredefinedTemplate={null}
                onPredefinedTemplateSelect={vi.fn(async () => undefined)}
                predefinedTemplates={predefinedTemplates}
                onTemplateFileSelect={vi.fn(async () => undefined)}
            />,
        )

        expect(screen.getByRole('combobox')).toHaveValue('')

        rerender(
            <TemplateSelectionCard
                selectedPredefinedTemplate={predefinedTemplates[0]}
                onPredefinedTemplateSelect={vi.fn(async () => undefined)}
                predefinedTemplates={predefinedTemplates}
                onTemplateFileSelect={vi.fn(async () => undefined)}
            />,
        )

        expect(screen.getByRole('combobox')).toHaveValue('CSV Template')
    })
})
