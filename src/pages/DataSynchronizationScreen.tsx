import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { type RootState } from '../redux/store.ts'
import { provideFileDownload } from '../utilities/FileDownloadProvider.ts'
import DownloadIcon from '../assets/download.svg'
import Style from './DataSynchronizationScreen.module.css'
import Config from '../config/config.json'
import { performParse } from '../utilities/CsvParser.ts'

export default function DataSynchronizationScreen() {
    const sourceFileURL: string = useSelector(
        (state: RootState) => state.file.value.source.objectUrl,
    )
    const destinationFileURL: string = useSelector(
        (state: RootState) => state.file.value.destination.objectUrl,
    )

    const [insertions, setInsertions] = useState<string>('')
    const [deletions, setDeletions] = useState<string>('')

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [errorMessages, setErrorMessages] = useState<string | null>(null)

    const navigation = useNavigate()

    const { t } = useTranslation()

    const targetName = Config.target.name

    useEffect(() => {
        async function fetchData() {
            setErrorMessages(null)
            setInsertions('')
            setDeletions('')
            setIsLoading(true)
            const [ins, outs] = await performParse(
                sourceFileURL,
                destinationFileURL,
            )
            setInsertions(ins)
            setDeletions(outs)
            setIsLoading(false)
        }

        if (sourceFileURL && destinationFileURL) {
            fetchData().catch(() => {
                setIsLoading(false)
                setInsertions('')
                setDeletions('')
                setErrorMessages(t('error_fetching_data'))
            })
        } else {
            navigation('/')
        }
    }, [sourceFileURL, destinationFileURL, navigation, t])

    function provideFile(content: string, fileName: string): void {
        provideFileDownload(content, t(fileName))
    }

    return (
        <div className={Style.dataSynchronizationScreen}>
            <div className={Style.dataSynchronizationScreenList}>
                <div className={Style.header}>
                    <p>{t('insert_into', { targetName })}</p>
                    <br />
                    <div className="tooltip">
                        <button
                            onClick={() =>
                                provideFile(insertions, 'insertion_filename')
                            }
                            disabled={insertions === ''}
                        >
                            <img src={DownloadIcon} alt="Download insertions" />
                        </button>
                        <span className="tooltipText">
                            {t('download_as_csv')}
                        </span>
                    </div>
                </div>
                <textarea
                    value={insertions}
                    readOnly
                    data-testid="insertions-textarea"
                ></textarea>
            </div>

            {isLoading && (
                <div
                    className={Style.loader}
                    role="status"
                    aria-label={t('loading_data')}
                ></div>
            )}
            {errorMessages && <p role="alert">{errorMessages}</p>}

            <div className={Style.dataSynchronizationScreenList}>
                <div className={Style.header}>
                    <p>{t('remove_from', { targetName })}</p>
                    <br />
                    <div className="tooltip">
                        <button
                            onClick={() =>
                                provideFile(deletions, 'deletion_filename')
                            }
                            disabled={deletions === ''}
                        >
                            <img src={DownloadIcon} alt="Download deletions" />
                        </button>
                        <span className="tooltipText">
                            {t('download_as_csv')}
                        </span>
                    </div>
                </div>
                <textarea
                    value={deletions}
                    readOnly
                    data-testid="deletions-textarea"
                ></textarea>
            </div>
        </div>
    )
}
