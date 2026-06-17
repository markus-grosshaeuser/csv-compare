import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { type FileDispatch, type RootState } from '../redux/store.ts'
import { setTargetFile, setSourceFile } from '../redux/fileSlice.ts'
import startIcon from '../assets/start.svg'
import Style from './DataSourceScreen.module.css'
import Config from '../config/config.json'
import MultiScreenNavigationButton from '../components/MultiScreenNavigationButton.tsx'
import DataSourceCard from '../components/DataSourceCard.tsx'

export default function DataSourceScreen() {
    const sourceFile = useSelector(
        (state: RootState) => state.file.value.source,
    )
    const targetFile = useSelector(
        (state: RootState) => state.file.value.target,
    )

    const navigate = useNavigate()
    const dispatch = useDispatch<FileDispatch>()
    const { t } = useTranslation()

    const csvFileFormat = {
        suffix: '.csv',
        mimeTypes: ['text/csv', 'application/vnd.ms-excel'],
    }

    function setSource(file: File) {
        URL.revokeObjectURL(sourceFile.objectUrl)
        dispatch(
            setSourceFile({
                name: file.name,
                objectUrl: URL.createObjectURL(file),
            }),
        )
    }

    function setTarget(file: File) {
        URL.revokeObjectURL(targetFile.objectUrl)
        dispatch(
            setTargetFile({
                name: file.name,
                objectUrl: URL.createObjectURL(file),
            }),
        )
    }

    function onButtonClick() {
        if (sourceFile.name && targetFile.name) {
            navigate('/sync')
        }
    }

    return (
        <div className={Style.dataSourceScreen}>
            <MultiScreenNavigationButton
                imageUrl={''}
                onClickCallback={() => {}}
                ariaLabel={''}
                testId={'button_placeholder'}
                disabled={true}
            />

            <DataSourceCard
                titleTranslationKey={'source_system'}
                config={Config.source}
                file={sourceFile}
                setter={setSource}
                fileFormats={[csvFileFormat]}
            />

            <DataSourceCard
                titleTranslationKey={'target_system'}
                config={Config.target}
                file={targetFile}
                setter={setTarget}
                fileFormats={[csvFileFormat]}
            />

            <MultiScreenNavigationButton
                imageUrl={startIcon}
                onClickCallback={onButtonClick}
                ariaLabel={t('continue_to_evaluation')}
                testId={'start_button'}
                disabled={!(sourceFile.name && targetFile.name)}
            />
        </div>
    )
}
