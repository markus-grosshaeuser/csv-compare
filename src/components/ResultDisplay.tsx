import Style from './ResultDisplay.module.css'
import DownloadIcon from '../assets/download.svg'
import { provideFileDownload } from '../utilities/FileDownloadProvider.ts'
import { useTranslation } from 'react-i18next'

type ResultDisplayProps = {
    titleTranslationKey: string
    fileNameTranslationKey: string
    targetSystemName: string
    data: string
    testId: string
}

export default function ResultDisplay({
    titleTranslationKey,
    fileNameTranslationKey,
    targetSystemName,
    data,
    testId,
}: ResultDisplayProps) {
    const { t } = useTranslation()
    return (
        <div className={Style.resultDisplay}>
            <div className={Style.header}>
                <p>
                    {t(titleTranslationKey, { targetName: targetSystemName })}
                </p>
                <br />
                <button
                    onClick={() =>
                        provideFileDownload(data, t(fileNameTranslationKey))
                    }
                    disabled={data === ''}
                    aria-label={t('download_as_csv')}
                >
                    {t('download_as_csv')}
                    <img src={DownloadIcon} alt="Download" aria-hidden="true" />
                </button>
            </div>
            <textarea value={data} readOnly data-testid={testId}></textarea>
        </div>
    )
}
