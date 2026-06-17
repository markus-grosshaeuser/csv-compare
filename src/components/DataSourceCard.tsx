import Style from './DataSourceCard.module.css'
import { useTranslation } from 'react-i18next'
import FileDropArea from './FileDropArea.tsx'
import type { FileEntry } from '../redux/fileSlice.ts'

type DataSourceCardProps = {
    titleTranslationKey: string
    config: { icon: string; name: string }
    file: FileEntry
    setter: (file: File) => void
    fileFormats: { suffix: string; mimeTypes: string[] }[]
}

export default function DataSourceCard({
    titleTranslationKey,
    config,
    file,
    setter,
    fileFormats,
}: DataSourceCardProps) {
    const { t } = useTranslation()

    return (
        <div className={Style.dataSourceCard}>
            <h2>
                {t(titleTranslationKey)}: <b>{config.name}</b>
            </h2>

            <p>
                {file.name
                    ? t('file') + ' ' + file.name
                    : t('no_file_selected')}
            </p>

            <FileDropArea
                fileEntry={file}
                onFileSelectedCallback={setter}
                supportedFileFormats={fileFormats}
            >
                <img alt="" src={config.icon} aria-hidden="true" />
            </FileDropArea>

            <p>{t('put_data_file_here')}</p>
        </div>
    )
}
