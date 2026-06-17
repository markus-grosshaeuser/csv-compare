import '../../src/config/i18n'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ResultDisplay from '../../src/components/ResultDisplay'
import { provideFileDownload } from '../../src/utilities/FileDownloadProvider'

vi.mock('../../src/utilities/FileDownloadProvider', () => ({
    provideFileDownload: vi.fn(),
}))

describe('File: ResultDisplay.tsx', () => {
    const defaultProps = {
        titleTranslationKey: 'insert_into',
        fileNameTranslationKey: 'insertion_filename',
        targetSystemName: 'Cloud System',
        data: 'id,name\n1,Ada\n2,Grace',
        testId: 'insertion-result',
    }

    const renderResultDisplay = ({
        titleTranslationKey = defaultProps.titleTranslationKey,
        fileNameTranslationKey = defaultProps.fileNameTranslationKey,
        targetSystemName = defaultProps.targetSystemName,
        data = defaultProps.data,
        testId = defaultProps.testId,
    }: {
        titleTranslationKey?: string
        fileNameTranslationKey?: string
        targetSystemName?: string
        data?: string
        testId?: string
    } = {}) => {
        return render(
            <ResultDisplay
                titleTranslationKey={titleTranslationKey}
                fileNameTranslationKey={fileNameTranslationKey}
                targetSystemName={targetSystemName}
                data={data}
                testId={testId}
            />,
        )
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('should render the translated title with the target system name', () => {
        renderResultDisplay()

        expect(
            screen.getByText('Create new in Cloud System:'),
        ).toBeInTheDocument()
    })

    it('should render a different translated title when another title key is provided', () => {
        renderResultDisplay({
            titleTranslationKey: 'remove_from',
            targetSystemName: 'Target CRM',
        })

        expect(screen.getByText('Remove from Target CRM:')).toBeInTheDocument()
    })

    it('should render the download button with translated text and accessible label', () => {
        renderResultDisplay()

        const downloadButton = screen.getByRole('button', {
            name: /download as csv/i,
        })

        expect(downloadButton).toBeInTheDocument()
        expect(downloadButton).toHaveTextContent('Download as CSV')
        expect(downloadButton).toHaveAttribute('aria-label', 'Download as CSV')
    })

    it('should render the download icon as decorative content', () => {
        renderResultDisplay()

        const downloadIcon = screen.getByAltText('Download')

        expect(downloadIcon).toBeInTheDocument()
        expect(downloadIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should render a read-only textarea with the provided test id', () => {
        renderResultDisplay({
            testId: 'custom-result-textarea',
        })

        const textarea = screen.getByTestId('custom-result-textarea')

        expect(textarea).toBeInTheDocument()
        expect(textarea).toHaveAttribute('readonly')
    })

    it('should display the provided CSV data in the textarea', () => {
        renderResultDisplay({
            data: 'email,name\nada@example.com,Ada Lovelace',
            testId: 'result-textarea',
        })

        expect(screen.getByTestId('result-textarea')).toHaveValue(
            'email,name\nada@example.com,Ada Lovelace',
        )
    })

    it('should render an empty textarea when data is empty', () => {
        renderResultDisplay({
            data: '',
            testId: 'empty-result-textarea',
        })

        expect(screen.getByTestId('empty-result-textarea')).toHaveValue('')
    })

    it('should enable the download button when data is available', () => {
        renderResultDisplay({
            data: 'id,name\n1,Ada',
        })

        expect(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        ).toBeEnabled()
    })

    it('should disable the download button when data is empty', () => {
        renderResultDisplay({
            data: '',
        })

        expect(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        ).toBeDisabled()
    })

    it('should call provideFileDownload with data and translated insertion filename when download is clicked', () => {
        renderResultDisplay({
            data: 'id,name\n1,Ada',
            fileNameTranslationKey: 'insertion_filename',
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        )

        expect(provideFileDownload).toHaveBeenCalledTimes(1)
        expect(provideFileDownload).toHaveBeenCalledWith(
            'id,name\n1,Ada',
            'insert_into_cloud.csv',
        )
    })

    it('should call provideFileDownload with data and translated deletion filename when configured for deletions', () => {
        renderResultDisplay({
            titleTranslationKey: 'remove_from',
            fileNameTranslationKey: 'deletion_filename',
            data: 'id,name\n2,Grace',
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        )

        expect(provideFileDownload).toHaveBeenCalledTimes(1)
        expect(provideFileDownload).toHaveBeenCalledWith(
            'id,name\n2,Grace',
            'suspend_from_cloud.csv',
        )
    })

    it('should not call provideFileDownload when the download button is disabled', () => {
        renderResultDisplay({
            data: '',
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        )

        expect(provideFileDownload).not.toHaveBeenCalled()
    })

    it('should update the displayed data when props change', () => {
        const { rerender } = render(
            <ResultDisplay
                titleTranslationKey="insert_into"
                fileNameTranslationKey="insertion_filename"
                targetSystemName="Cloud System"
                data="1,Ada"
                testId="result-textarea"
            />,
        )

        expect(screen.getByTestId('result-textarea')).toHaveValue('1,Ada')

        rerender(
            <ResultDisplay
                titleTranslationKey="insert_into"
                fileNameTranslationKey="insertion_filename"
                targetSystemName="Cloud System"
                data="2,Grace"
                testId="result-textarea"
            />,
        )

        expect(screen.getByTestId('result-textarea')).toHaveValue('2,Grace')
    })

    it('should update the button disabled state when data changes', () => {
        const { rerender } = render(
            <ResultDisplay
                titleTranslationKey="insert_into"
                fileNameTranslationKey="insertion_filename"
                targetSystemName="Cloud System"
                data=""
                testId="result-textarea"
            />,
        )

        expect(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        ).toBeDisabled()

        rerender(
            <ResultDisplay
                titleTranslationKey="insert_into"
                fileNameTranslationKey="insertion_filename"
                targetSystemName="Cloud System"
                data="id,name\n1,Ada"
                testId="result-textarea"
            />,
        )

        expect(
            screen.getByRole('button', {
                name: /download as csv/i,
            }),
        ).toBeEnabled()
    })
})
