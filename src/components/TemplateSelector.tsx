import type { TemplateInfo } from '../utilities/TemplateLoader.ts'
import * as React from 'react'
import Style from './TemplateSelector.module.css'
import { useTranslation } from 'react-i18next'
import type { JSX } from 'react'

type TemplateSelectorProps = {
    selectedPredefinedTemplate: TemplateInfo | null
    onPredefinedTemplateSelect: (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => Promise<void>
    predefinedTemplates: TemplateInfo[]
}

/**
 * Renders a dropdown selector for predefined templates, allowing users to choose from available options.
 *
 * @param {Object} props - The properties passed to the TemplateSelector component.
 * @param {Object|null} props.selectedPredefinedTemplate - The currently selected predefined template object, or null if none is selected.
 * @param {Function} props.onPredefinedTemplateSelect - Callback function triggered when a new template is selected from the dropdown.
 * @param {Array<Object>} props.predefinedTemplates - An array of predefined template objects available for selection.
 * @return {JSX.Element} A select dropdown element for choosing predefined templates.
 */
export default function TemplateSelector({
    selectedPredefinedTemplate,
    onPredefinedTemplateSelect,
    predefinedTemplates,
}: TemplateSelectorProps): JSX.Element {
    const { t } = useTranslation()

    return (
        <select
            className={Style.templateSelect}
            value={
                selectedPredefinedTemplate
                    ? selectedPredefinedTemplate.name
                    : ''
            }
            onChange={(e) => onPredefinedTemplateSelect(e)}
        >
            <option value="" disabled data-testid="placeholder">
                {predefinedTemplates.length === 0
                    ? t('"no_matching_template_found":')
                    : t('"choose_template":')}
            </option>

            {predefinedTemplates.map((template) => (
                <option key={template.name} value={template.name}>
                    {template.name}
                </option>
            ))}
        </select>
    )
}
