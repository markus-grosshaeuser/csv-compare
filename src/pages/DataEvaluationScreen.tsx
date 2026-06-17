import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { type RootState } from '../redux/store.ts'
import Style from './DataEvaluationScreen.module.css'
import Config from '../config/config.json'
import { processFiles } from '../utilities/CsvParser.ts'
import type { Template } from '../redux/templateSlice.ts'
import type { FileState } from '../redux/fileSlice.ts'
import ResultDisplay from '../components/ResultDisplay.tsx'
import type { HeaderState } from '../redux/csvHeaderSlice.ts'

export default function DataEvaluationScreen() {
    const inputFiles: FileState = useSelector(
        (state: RootState) => state.file.value,
    )

    const header: HeaderState = useSelector(
        (state: RootState) => state.csvHeader.value,
    )

    const template: Template = useSelector(
        (state: RootState) => state.template.value,
    )

    const [insertions, setInsertions] = useState<string>('')
    const [deletions, setDeletions] = useState<string>('')

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [errorMessages, setErrorMessages] = useState<string | null>(null)

    const navigate = useNavigate()

    const { t } = useTranslation()

    useEffect(() => {
        async function fetchData() {
            setErrorMessages(null)
            setInsertions('')
            setDeletions('')
            setIsLoading(true)
            const [ins, outs] = await processFiles(
                template,
                header.sourceHeader,
                inputFiles.source.objectUrl,
                header.targetHeader,
                inputFiles.target.objectUrl,
            )
            setInsertions(ins)
            setDeletions(outs)
            setIsLoading(false)
        }

        if (inputFiles.source.objectUrl && inputFiles.target.objectUrl) {
            fetchData().catch(() => {
                setIsLoading(false)
                setInsertions('')
                setDeletions('')
                setErrorMessages(t('error_fetching_data'))
            })
        } else {
            navigate('/')
        }
    }, [inputFiles, header, navigate, t, template])

    return (
        <div className={Style.dataEvaluationScreen}>
            <ResultDisplay
                titleTranslationKey={'insert_into'}
                fileNameTranslationKey={'insertion_filename'}
                targetSystemName={Config.target.name}
                data={insertions}
                testId={'insertions-textarea'}
            />

            {isLoading && (
                <div
                    className={Style.loader}
                    role="status"
                    aria-label={t('loading_data')}
                ></div>
            )}
            {errorMessages && <p role="alert">{errorMessages}</p>}

            <ResultDisplay
                titleTranslationKey={'remove_from'}
                fileNameTranslationKey={'deletion_filename'}
                targetSystemName={Config.target.name}
                data={deletions}
                testId={'deletions-textarea'}
            />
        </div>
    )
}
