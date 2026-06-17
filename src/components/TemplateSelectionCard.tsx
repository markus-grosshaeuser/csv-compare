import type { TemplateInfo } from '../utilities/TemplateLoader.ts'
import * as React from 'react'
import Style from './TemplateSelectionCard.module.css'
import TemplateSelector from './TemplateSelector.tsx'
import FileDropArea from './FileDropArea.tsx'
import uploadFile from '../assets/upload_file.svg'
import { useTranslation } from 'react-i18next'

type TemplateSelectionCardProps = {
    selectedPredefinedTemplate: TemplateInfo | null
    onPredefinedTemplateSelect: (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => Promise<void>
    predefinedTemplates: TemplateInfo[]
    onTemplateFileSelect: (file: File) => Promise<void>
}

export default function TemplateSelectionCard({
    selectedPredefinedTemplate,
    onPredefinedTemplateSelect,
    predefinedTemplates,
    onTemplateFileSelect,
}: TemplateSelectionCardProps) {
    const { t } = useTranslation()

    return (
        <div className={Style.templateSelectionCard}>
            <h2>{t('choose_template')}</h2>

            <TemplateSelector
                selectedPredefinedTemplate={selectedPredefinedTemplate}
                onPredefinedTemplateSelect={onPredefinedTemplateSelect}
                predefinedTemplates={predefinedTemplates}
            />

            <FileDropArea
                fileEntry={{ name: '', objectUrl: '' }}
                onFileSelectedCallback={onTemplateFileSelect}
                supportedFileFormats={[
                    {
                        suffix: 'json',
                        mimeTypes: ['application/json', 'text/json'],
                    },
                ]}
            >
                <img alt="" src={uploadFile} aria-hidden="true" />
            </FileDropArea>

            <p>{t('put_data_file_here')}</p>
        </div>
    )
}
