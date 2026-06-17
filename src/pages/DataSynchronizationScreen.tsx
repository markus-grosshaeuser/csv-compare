import Style from './DataSynchronizationScreen.module.css'
import { useDispatch, useSelector } from 'react-redux'
import type {
    CsvHeaderDispatch,
    RootState,
    TemplateDispatch,
} from '../redux/store.ts'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { parseFileHeader } from '../utilities/CsvParser.ts'
import arrowLeft from '../assets/arrow_left.svg'
import arrowRight from '../assets/arrow_right.svg'
import { useNavigate } from 'react-router-dom'
import { setTemplate, type Template } from '../redux/templateSlice.ts'
import {
    findMatchingTemplates,
    loadTemplateFromFile,
    loadTemplateFromURL,
    type TemplateInfo,
    verifyTemplateFileDataFormat,
} from '../utilities/TemplateLoader.ts'
import type { MatchingColumnsTuple } from '../utilities/CsvUtility.ts'
import { useTranslation } from 'react-i18next'
import TemplateSelectionCard from '../components/TemplateSelectionCard.tsx'
import TemplateCreationCard from '../components/TemplateCreationCard.tsx'
import estimateTemplate from '../utilities/TemplateEstimator.ts'
import {
    type HeaderState,
    setSourceHeader,
    setTargetHeader,
} from '../redux/csvHeaderSlice.ts'
import type { FileState } from '../redux/fileSlice.ts'
import MultiScreenNavigationButton from '../components/MultiScreenNavigationButton.tsx'

export default function DataSynchronizationScreen() {
    const inputFiles: FileState = useSelector(
        (state: RootState) => state.file.value,
    )
    const header: HeaderState = useSelector(
        (state: RootState) => state.csvHeader.value,
    )

    const [templatePrimaryKey, setTemplatePrimaryKey] = useState<
        Map<string, string>
    >(new Map())
    const [templateMapping, setTemplateMapping] = useState<Map<string, string>>(
        new Map(),
    )

    const [predefinedTemplates, setPredefinedTemplates] = useState<
        TemplateInfo[]
    >([])
    const [selectedPredefinedTemplate, setSelectedPredefinedTemplate] =
        useState<TemplateInfo | null>(null)

    const templateDispatch = useDispatch<TemplateDispatch>()
    const headerDispatch = useDispatch<CsvHeaderDispatch>()

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [errorMessages, setErrorMessages] = useState<string | null>(null)

    const navigation = useNavigate()

    const { t } = useTranslation()

    useEffect(() => {
        async function initializeTemplateMapping() {
            setIsLoading(true)
            setErrorMessages(null)
            const { sourceSystemHeader, targetSystemHeader } =
                await fetchHeaders(inputFiles)
            const sortedMatchingTemplates = await fetchMatchingTemplates(
                sourceSystemHeader,
                targetSystemHeader,
            )

            headerDispatch(setSourceHeader(sourceSystemHeader))
            headerDispatch(setTargetHeader(targetSystemHeader))
            setPredefinedTemplates(sortedMatchingTemplates)

            const firstTemplate = sortedMatchingTemplates[0] ?? null
            setSelectedPredefinedTemplate(firstTemplate)

            const template = await fetchTemplateDefault(
                firstTemplate,
                sourceSystemHeader,
                targetSystemHeader,
            )
            if (template) {
                applyTemplate(template)
                templateDispatch(setTemplate(template))
            }
            setIsLoading(false)
        }

        if (inputFiles.source.objectUrl && inputFiles.target.objectUrl) {
            initializeTemplateMapping().catch(() => {
                setErrorMessages(t('error_fetching_data'))
                setIsLoading(false)
            })
        } else {
            navigation('/')
        }
    }, [inputFiles, navigation, headerDispatch, templateDispatch, t])

    async function fetchHeaders(inputFiles: FileState) {
        const sourceSystemHeader = await parseFileHeader(
            inputFiles.source.objectUrl,
        )
        const targetSystemHeader = await parseFileHeader(
            inputFiles.target.objectUrl,
        )
        return {
            sourceSystemHeader,
            targetSystemHeader,
        }
    }

    async function fetchMatchingTemplates(
        sourceSystemHeader: string[],
        targetSystemHeader: string[],
    ) {
        const matchingTemplates = await findMatchingTemplates(
            sourceSystemHeader,
            targetSystemHeader,
        )
        return matchingTemplates.sort((a, b) => a.name.localeCompare(b.name))
    }

    async function fetchTemplateDefault(
        firstTemplate: TemplateInfo,
        sourceSystemHeader: string[],
        targetSystemHeader: string[],
    ) {
        if (firstTemplate) {
            const templateFromURL = await loadTemplateFromURL(
                firstTemplate.path,
            )
            if (verifyTemplateFileDataFormat(templateFromURL)) {
                return templateFromURL
            }
        } else {
            return estimateTemplate(sourceSystemHeader, targetSystemHeader)
        }
    }

    function buildTemplateFromState(): Template {
        const columnMatch: MatchingColumnsTuple[] = header.targetHeader.map(
            (target) => ({
                target,
                source: templateMapping.get(target) ?? '',
            }),
        )

        const primaryKey: MatchingColumnsTuple[] = Array.from(
            templatePrimaryKey.entries(),
        ).map(([target, source]) => ({
            target,
            source,
        }))

        return {
            column_match: columnMatch,
            primary_key: primaryKey,
        }
    }

    function applyTemplate(templateFileData: {
        primary_key: MatchingColumnsTuple[]
        column_match: MatchingColumnsTuple[]
    }) {
        setTemplatePrimaryKey(
            new Map(
                templateFileData.primary_key.map(
                    ({ source, target }: MatchingColumnsTuple) => {
                        return [target, source]
                    },
                ),
            ),
        )

        setTemplateMapping(
            new Map(
                templateFileData.column_match
                    .filter(({ target }: MatchingColumnsTuple) => target !== '')
                    .map(({ source, target }: MatchingColumnsTuple) => {
                        return [target, source]
                    }),
            ),
        )
    }

    async function onTemplateFileSelect(file: File) {
        const templateFromFile = await loadTemplateFromFile(file)

        if (verifyTemplateFileDataFormat(templateFromFile)) {
            templateDispatch(setTemplate(templateFromFile))
            applyTemplate(templateFromFile)
        }
    }

    function onPrimaryKeyElementChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const targetColumn = event.target.name
        const checked = event.target.checked

        setTemplatePrimaryKey((currentPrimaryKey) => {
            const nextPrimaryKey = new Map(currentPrimaryKey)

            if (checked) {
                const mappedSourceColumn =
                    templateMapping.get(targetColumn) ?? ''
                nextPrimaryKey.set(targetColumn, mappedSourceColumn)
            } else {
                nextPrimaryKey.delete(targetColumn)
            }

            return nextPrimaryKey
        })
    }

    function onColumMatchElementChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        const targetColumn = event.target.name
        const sourceColumn = event.target.value

        setTemplateMapping((currentMapping) => {
            const nextMapping = new Map(currentMapping)
            nextMapping.set(targetColumn, sourceColumn)
            return nextMapping
        })

        setTemplatePrimaryKey((currentPrimaryKey) => {
            if (!currentPrimaryKey.has(targetColumn)) {
                return currentPrimaryKey
            }

            const nextPrimaryKey = new Map(currentPrimaryKey)
            nextPrimaryKey.set(targetColumn, sourceColumn)
            return nextPrimaryKey
        })
    }

    async function onPredefinedTemplateSelect(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        const selectedTemplate = predefinedTemplates.find((template) => {
            return template.name === event.target.value
        })

        if (selectedTemplate) {
            const templateFromURL = await loadTemplateFromURL(
                selectedTemplate.path,
            )

            if (verifyTemplateFileDataFormat(templateFromURL)) {
                templateDispatch(setTemplate(templateFromURL))
                applyTemplate(templateFromURL)
                setSelectedPredefinedTemplate(selectedTemplate)
            }
        }
    }

    function onContinueToEvaluationClick() {
        templateDispatch(setTemplate(buildTemplateFromState()))
        navigation('/evaluation')
    }

    return (
        <div className={Style.dataSynchronizationScreen}>
            <MultiScreenNavigationButton
                imageUrl={arrowLeft}
                onClickCallback={() => navigation('/')}
                ariaLabel={t('return_to_previous_screen')}
                testId={''}
            />

            <TemplateSelectionCard
                selectedPredefinedTemplate={selectedPredefinedTemplate}
                onPredefinedTemplateSelect={onPredefinedTemplateSelect}
                predefinedTemplates={predefinedTemplates}
                onTemplateFileSelect={onTemplateFileSelect}
            />

            {isLoading && (
                <div
                    className={Style.loader}
                    role="status"
                    aria-label={t('loading_data')}
                ></div>
            )}
            {errorMessages && (
                <p role="alert" className={Style.errorMessage}>
                    {errorMessages}
                </p>
            )}

            <TemplateCreationCard
                targetHeader={header.targetHeader}
                templatePrimaryKey={templatePrimaryKey}
                onPrimaryKeyElementChange={onPrimaryKeyElementChange}
                templateMapping={templateMapping}
                onColumMatchElementChange={onColumMatchElementChange}
                sourceHeader={header.sourceHeader}
            />

            <MultiScreenNavigationButton
                imageUrl={arrowRight}
                onClickCallback={() => onContinueToEvaluationClick()}
                ariaLabel={t('continue_to_evaluation')}
                testId={''}
                disabled={
                    !(templatePrimaryKey.size > 0) ||
                    !(templateMapping.size > 0) ||
                    !header.targetHeader.length ||
                    !header.sourceHeader.length
                }
            />
        </div>
    )
}
