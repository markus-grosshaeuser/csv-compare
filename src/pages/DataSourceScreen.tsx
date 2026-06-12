import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import FileDropArea from '../components/FileDropArea.tsx'
import { type FileDispatch, type RootState } from '../redux/store.ts'
import { setDestinationFile, setSourceFile } from '../redux/fileSlice.ts'
import startIcon from '../assets/start.svg'
import Style from './DataSourceScreen.module.css'
import Config from '../config/config.json'

export default function DataSourceScreen() {
    const sourceFile = useSelector(
        (state: RootState) => state.file.value.source,
    )
    const destinationFile = useSelector(
        (state: RootState) => state.file.value.destination,
    )

    const navigate = useNavigate()
    const dispatch = useDispatch<FileDispatch>()
    const { t } = useTranslation()

    function onButtonClick() {
        if (sourceFile.name && destinationFile.name) {
            navigate('/evaluation')
        }
    }

    function setSource(file: File) {
        if (sourceFile.objectUrl) {
            URL.revokeObjectURL(sourceFile.objectUrl)
        }
        dispatch(
            setSourceFile({
                name: file.name,
                objectUrl: URL.createObjectURL(file),
            }),
        )
    }

    function setDestination(file: File) {
        if (destinationFile.objectUrl) {
            URL.revokeObjectURL(destinationFile.objectUrl)
        }
        dispatch(
            setDestinationFile({
                name: file.name,
                objectUrl: URL.createObjectURL(file),
            }),
        )
    }

    return (
        <div className={Style.dataSourceScreen}>
            <div className={Style.symmetricButtonBalancer}></div>

            <div className={Style.dataSourceCard}>
                <h2>
                    {t('data_source')}: <b>{Config.source.name}</b>
                </h2>
                <p>
                    {sourceFile.name
                        ? t('file') + ' ' + sourceFile.name
                        : t('no_file_selected')}
                </p>
                <FileDropArea fileEntry={sourceFile} setter={setSource}>
                    <img alt="" src={Config.source.icon} aria-hidden="true" />
                </FileDropArea>
                <p>{t('put_data_file_here')}</p>
            </div>

            <div className={Style.dataSourceCard}>
                <h2>
                    {t('data_source')}: <b>{Config.target.name}</b>
                </h2>
                <p>
                    {destinationFile.name
                        ? t('file') + ' ' + destinationFile.name
                        : t('no_file_selected')}
                </p>
                <FileDropArea
                    fileEntry={destinationFile}
                    setter={setDestination}
                >
                    <img alt="" src={Config.target.icon} aria-hidden="true" />
                </FileDropArea>
                <p>{t('put_data_file_here')}</p>
            </div>

            <div
                role="button"
                data-testid="evaluation_button"
                hidden={!(sourceFile.name && destinationFile.name)}
                className={
                    (sourceFile.name && destinationFile.name
                        ? Style.buttonEnabled
                        : Style.buttonDisabled) +
                    ' ' +
                    Style.button
                }
                aria-label={t('continue_to_evaluation')}
                onClick={onButtonClick}
            >
                <img
                    alt=""
                    src={startIcon}
                    aria-hidden="true"
                    hidden={!(sourceFile.name && destinationFile.name)}
                />
            </div>
        </div>
    )
}
