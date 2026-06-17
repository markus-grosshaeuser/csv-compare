import '../../src/config/i18n'

import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TemplateSelector from '../../src/components/TemplateSelector'
import type { TemplateInfo } from '../../src/utilities/TemplateLoader'
import * as React from 'react'

describe('File: TemplateSelector.tsx', () => {
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

    const renderTemplateSelector = ({
        selectedPredefinedTemplate = null,
        onPredefinedTemplateSelect = vi.fn(async () => undefined),
        predefinedTemplatesValue = predefinedTemplates,
    }: {
        selectedPredefinedTemplate?: TemplateInfo | null
        onPredefinedTemplateSelect?: (
            event: React.ChangeEvent<HTMLSelectElement>,
        ) => Promise<void>
        predefinedTemplatesValue?: TemplateInfo[]
    } = {}) => {
        const renderResult = render(
            <TemplateSelector
                selectedPredefinedTemplate={selectedPredefinedTemplate}
                onPredefinedTemplateSelect={onPredefinedTemplateSelect}
                predefinedTemplates={predefinedTemplatesValue}
            />,
        )

        return {
            onPredefinedTemplateSelect,
            ...renderResult,
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('should render a select element', () => {
        renderTemplateSelector()

        expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render the choose-template placeholder when templates are available', () => {
        renderTemplateSelector()

        const selector = screen.getByRole('combobox')
        const placeholder = within(selector).getByTestId('placeholder')

        expect(placeholder).toBeInTheDocument()
        expect(placeholder).toBeDisabled()
        expect(placeholder).toHaveValue('')
    })

    it('should render the no-matching-template placeholder when no templates are available', () => {
        renderTemplateSelector({
            predefinedTemplatesValue: [],
        })

        const selector = screen.getByRole('combobox')
        // const placeholder = within(selector).getByRole('option', {
        //     name: '"no_matching_template_found":',
        // })

        const placeholder = within(selector).getByTestId('placeholder')

        expect(placeholder).toBeInTheDocument()
        expect(placeholder).toBeDisabled()
        expect(placeholder).toHaveValue('')
    })

    it('should render all predefined template options', () => {
        renderTemplateSelector()

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

    it('should select an empty value when no template is selected', () => {
        renderTemplateSelector({
            selectedPredefinedTemplate: null,
        })

        expect(screen.getByRole('combobox')).toHaveValue('')
    })

    it('should select the provided predefined template', () => {
        renderTemplateSelector({
            selectedPredefinedTemplate: predefinedTemplates[1],
        })

        expect(screen.getByRole('combobox')).toHaveValue('CRM Template')
    })

    it('should call the change callback when another template is selected', () => {
        const onPredefinedTemplateSelect = vi.fn(async () => undefined)

        renderTemplateSelector({
            onPredefinedTemplateSelect,
        })

        fireEvent.change(screen.getByRole('combobox'), {
            target: {
                value: 'CRM Template',
            },
        })

        expect(onPredefinedTemplateSelect).toHaveBeenCalledTimes(1)
    })
})
