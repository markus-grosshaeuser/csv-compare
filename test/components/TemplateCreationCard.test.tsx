import '../../src/config/i18n'

import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TemplateCreationCard from '../../src/components/TemplateCreationCard'
import { provideFileDownload } from '../../src/utilities/FileDownloadProvider'
import { renderWithProviders } from '../RenderWIthProvider'
import * as React from 'react'

vi.mock('../../src/utilities/FileDownloadProvider', () => ({
    provideFileDownload: vi.fn(),
}))

describe('File: TemplateCreationCard.tsx', () => {
    const targetHeader = ['employee_id', 'first_name', 'email']
    const sourceHeader = ['id', 'name', 'mail']

    const template = {
        primary_key: [{ source: 'id', target: 'employee_id' }],
        column_match: [
            { source: 'id', target: 'employee_id' },
            { source: 'name', target: 'first_name' },
            { source: 'mail', target: 'email' },
        ],
    }

    const preloadedState = {
        template: {
            value: template,
        },
    }

    const renderTemplateCreationCard = ({
        targetHeaderValue = targetHeader,
        templatePrimaryKey = new Map<string, string>([['employee_id', 'id']]),
        onPrimaryKeyElementChange = vi.fn(),
        templateMapping = new Map<string, string>([
            ['employee_id', 'id'],
            ['first_name', 'name'],
            ['email', 'mail'],
        ]),
        onColumMatchElementChange = vi.fn(),
        sourceHeaderValue = sourceHeader,
        state = preloadedState,
    }: {
        targetHeaderValue?: string[]
        templatePrimaryKey?: Map<string, string>
        onPrimaryKeyElementChange?: (
            event: React.ChangeEvent<HTMLInputElement>,
        ) => void
        templateMapping?: Map<string, string>
        onColumMatchElementChange?: (
            event: React.ChangeEvent<HTMLSelectElement>,
        ) => void
        sourceHeaderValue?: string[]
        state?: unknown
    } = {}) => {
        const renderResult = renderWithProviders(
            <TemplateCreationCard
                targetHeader={targetHeaderValue}
                templatePrimaryKey={templatePrimaryKey}
                onPrimaryKeyElementChange={onPrimaryKeyElementChange}
                templateMapping={templateMapping}
                onColumMatchElementChange={onColumMatchElementChange}
                sourceHeader={sourceHeaderValue}
            />,
            {
                preloadedState: state,
            },
        )

        return {
            onPrimaryKeyElementChange,
            onColumMatchElementChange,
            ...renderResult,
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('should render the translated card heading', () => {
        renderTemplateCreationCard()
        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Compose template',
            }),
        ).toBeInTheDocument()
    })

    it('should render the mapping column titles', () => {
        renderTemplateCreationCard()

        expect(screen.getByText('PK |')).toBeInTheDocument()
        expect(screen.getByText('Target System')).toBeInTheDocument()
        expect(screen.getByText('Source System')).toBeInTheDocument()
    })

    it('should render all target columns', () => {
        renderTemplateCreationCard()

        expect(screen.getByText('employee_id')).toBeInTheDocument()
        expect(screen.getByText('first_name')).toBeInTheDocument()
        expect(screen.getByText('email')).toBeInTheDocument()
    })

    it('should render one checkbox per target column', () => {
        renderTemplateCreationCard()

        expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    it('should render one select per target column', () => {
        renderTemplateCreationCard()

        expect(screen.getAllByRole('combobox')).toHaveLength(3)
    })

    it('should check primary-key checkboxes when target columns exist in the primary-key map', () => {
        renderTemplateCreationCard({
            templatePrimaryKey: new Map<string, string>([
                ['employee_id', 'id'],
                ['email', 'mail'],
            ]),
        })

        const checkboxes = screen.getAllByRole('checkbox')

        expect(checkboxes[0]).toBeChecked()
        expect(checkboxes[1]).not.toBeChecked()
        expect(checkboxes[2]).toBeChecked()
    })

    it('should leave all primary-key checkboxes unchecked when the primary-key map is empty', () => {
        renderTemplateCreationCard({
            templatePrimaryKey: new Map<string, string>(),
        })

        screen.getAllByRole('checkbox').forEach((checkbox) => {
            expect(checkbox).not.toBeChecked()
        })
    })

    it('should set checkbox names from target columns', () => {
        renderTemplateCreationCard()

        const checkboxes = screen.getAllByRole('checkbox')

        expect(checkboxes[0]).toHaveAttribute('name', 'employee_id')
        expect(checkboxes[1]).toHaveAttribute('name', 'first_name')
        expect(checkboxes[2]).toHaveAttribute('name', 'email')
    })

    it('should call the primary-key change callback when a checkbox is toggled', () => {
        const onPrimaryKeyElementChange = vi.fn()

        renderTemplateCreationCard({
            onPrimaryKeyElementChange,
        })

        const checkboxes = screen.getAllByRole('checkbox')

        fireEvent.click(checkboxes[1])

        expect(onPrimaryKeyElementChange).toHaveBeenCalledTimes(1)
        expect(onPrimaryKeyElementChange.mock.calls[0][0].target.name).toBe(
            'first_name',
        )
    })

    it('should render source columns as options for each select', () => {
        renderTemplateCreationCard()

        const selects = screen.getAllByRole('combobox')

        selects.forEach((select) => {
            expect(
                within(select).getByRole('option', { name: '' }),
            ).toBeInTheDocument()
            expect(
                within(select).getByRole('option', { name: 'id' }),
            ).toBeInTheDocument()
            expect(
                within(select).getByRole('option', { name: 'name' }),
            ).toBeInTheDocument()
            expect(
                within(select).getByRole('option', { name: 'mail' }),
            ).toBeInTheDocument()
        })
    })

    it('should set select names from target columns', () => {
        renderTemplateCreationCard()

        const selects = screen.getAllByRole('combobox')

        expect(selects[0]).toHaveAttribute('name', 'employee_id')
        expect(selects[1]).toHaveAttribute('name', 'first_name')
        expect(selects[2]).toHaveAttribute('name', 'email')
    })

    it('should select mapped source columns from the template mapping', () => {
        renderTemplateCreationCard({
            templateMapping: new Map<string, string>([
                ['employee_id', 'id'],
                ['first_name', 'name'],
                ['email', 'mail'],
            ]),
        })

        const selects = screen.getAllByRole('combobox')

        expect(selects[0]).toHaveValue('id')
        expect(selects[1]).toHaveValue('name')
        expect(selects[2]).toHaveValue('mail')
    })

    it('should use an empty select value when a target column is not mapped', () => {
        renderTemplateCreationCard({
            templateMapping: new Map<string, string>([['employee_id', 'id']]),
        })

        const selects = screen.getAllByRole('combobox')

        expect(selects[0]).toHaveValue('id')
        expect(selects[1]).toHaveValue('')
        expect(selects[2]).toHaveValue('')
    })

    it('should call the column-match change callback when a select value changes', () => {
        const onColumMatchElementChange = vi.fn()

        renderTemplateCreationCard({
            onColumMatchElementChange,
            templateMapping: new Map<string, string>(),
        })

        const selects = screen.getAllByRole('combobox')

        fireEvent.change(selects[1], {
            target: {
                name: 'first_name',
                value: 'name',
            },
        })

        expect(onColumMatchElementChange).toHaveBeenCalledTimes(1)
        expect(onColumMatchElementChange.mock.calls[0][0].target.name).toBe(
            'first_name',
        )
    })

    it('should render no mapping rows when target headers are empty', () => {
        renderTemplateCreationCard({
            targetHeaderValue: [],
        })

        expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
        expect(screen.queryAllByRole('combobox')).toHaveLength(0)
        expect(
            screen.getByRole('button', { name: /download template/i }),
        ).toBeInTheDocument()
    })

    it('should render empty selects when source headers are empty', () => {
        renderTemplateCreationCard({
            sourceHeaderValue: [],
            templateMapping: new Map<string, string>(),
        })

        const selects = screen.getAllByRole('combobox')

        selects.forEach((select) => {
            expect(within(select).getAllByRole('option')).toHaveLength(1)
            expect(select).toHaveValue('')
        })
    })

    it('should render the download-template button with translated text and accessible label', () => {
        renderTemplateCreationCard()

        const button = screen.getByRole('button', {
            name: /download template/i,
        })

        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('Download Template')
        expect(button).toHaveAttribute('aria-label', 'Download Template')
    })

    it('should enable the download button when a template exists in the store', () => {
        renderTemplateCreationCard()

        expect(
            screen.getByRole('button', {
                name: /download template/i,
            }),
        ).toBeEnabled()
    })

    it('should call provideFileDownload with the serialized template and translated file name', () => {
        renderTemplateCreationCard()

        fireEvent.click(
            screen.getByRole('button', {
                name: /download template/i,
            }),
        )

        expect(provideFileDownload).toHaveBeenCalledTimes(1)
        expect(provideFileDownload).toHaveBeenCalledWith(
            JSON.stringify(template),
            'template.json',
        )
    })

    it('should serialize the current template from Redux when downloading', () => {
        const customTemplate = {
            primary_key: [{ source: 'mail', target: 'email' }],
            column_match: [{ source: 'mail', target: 'email' }],
        }

        renderTemplateCreationCard({
            state: {
                template: {
                    value: customTemplate,
                },
            },
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: /download template/i,
            }),
        )

        expect(provideFileDownload).toHaveBeenCalledTimes(1)
        expect(provideFileDownload).toHaveBeenCalledWith(
            JSON.stringify(customTemplate),
            'template.json',
        )
    })

    it('should render decorative mapping arrow icons and the decorative download icon', () => {
        const { container } = renderTemplateCreationCard()

        const images = container.querySelectorAll('img')

        expect(images).toHaveLength(targetHeader.length + 1)

        images.forEach((image) => {
            expect(image).toHaveAttribute('aria-hidden', 'true')
        })
    })
})
