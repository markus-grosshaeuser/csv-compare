import * as React from 'react'
import Style from './TemplateCreationCard.module.css'
import Arrow from '../assets/arrows_outward.svg'
import DownloadIcon from '../assets/download.svg'
import { useTranslation } from 'react-i18next'
import { provideFileDownload } from '../utilities/FileDownloadProvider.ts'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store.ts'
import type { Template } from '../redux/templateSlice.ts'

type ColumnMappingCardProps = {
    targetHeader: string[]
    templatePrimaryKey: Map<string, string>
    onPrimaryKeyElementChange: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void
    templateMapping: Map<string, string>
    onColumMatchElementChange: (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => void
    sourceHeader: string[]
}

export default function TemplateCreationCard({
    targetHeader,
    templatePrimaryKey,
    onPrimaryKeyElementChange,
    templateMapping,
    onColumMatchElementChange,
    sourceHeader,
}: ColumnMappingCardProps) {
    const template: Template = useSelector(
        (state: RootState) => state.template.value,
    )

    const { t } = useTranslation()

    function onDownloadButtonClick() {
        provideFileDownload(JSON.stringify(template), t('template_filename'))
    }

    return (
        <div className={Style.templateCreationCard}>
            <h2>{t('compose_template')}</h2>
            <div className={Style.mappingContainer}>
                <div className={Style.mappingTitle}>
                    <div>
                        <p>PK&nbsp;|</p>
                        <p>&nbsp;{t('target_system')}</p>
                    </div>
                    <p>{t('source_system')}</p>
                </div>
                {targetHeader.map((targetColumn) => (
                    <div className={Style.mapping} key={targetColumn}>
                        <input
                            type="checkbox"
                            name={targetColumn}
                            checked={templatePrimaryKey.has(targetColumn)}
                            onChange={(e) => onPrimaryKeyElementChange(e)}
                        />
                        <div>
                            <p>{targetColumn}</p>
                            <img alt="" src={Arrow} aria-hidden="true" />
                        </div>

                        <select
                            name={targetColumn}
                            value={templateMapping.get(targetColumn) ?? ''}
                            onChange={(e) => onColumMatchElementChange(e)}
                        >
                            <option value=""></option>
                            {sourceHeader.map((sourceColumn) => (
                                <option key={sourceColumn} value={sourceColumn}>
                                    {sourceColumn}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            <button
                onClick={onDownloadButtonClick}
                disabled={template === undefined}
                aria-label={t('download_template')}
            >
                {t('download_template')}
                <img src={DownloadIcon} alt="Download" aria-hidden="true" />
            </button>
        </div>
    )
}
