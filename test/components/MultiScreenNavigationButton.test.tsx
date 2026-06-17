import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MultiScreenNavigationButton from '../../src/components/MultiScreenNavigationButton'

describe('File: MultiScreenNavigationButton.tsx', () => {
    const defaultProps = {
        imageUrl: '/img/arrow-right.svg',
        onClickCallback: vi.fn(),
        ariaLabel: 'Continue to next screen',
        testId: 'continue-button',
    }

    const renderMultiScreenNavigationButton = ({
        imageUrl = defaultProps.imageUrl,
        onClickCallback = defaultProps.onClickCallback,
        ariaLabel = defaultProps.ariaLabel,
        testId = defaultProps.testId,
        disabled,
    }: {
        imageUrl?: string
        onClickCallback?: () => void
        ariaLabel?: string
        testId?: string
        disabled?: boolean
    } = {}) => {
        const renderResult = render(
            <MultiScreenNavigationButton
                imageUrl={imageUrl}
                onClickCallback={onClickCallback}
                ariaLabel={ariaLabel}
                testId={testId}
                disabled={disabled}
            />,
        )

        return {
            onClickCallback,
            ...renderResult,
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    it('should render a button with the provided accessible label', () => {
        renderMultiScreenNavigationButton()

        expect(
            screen.getByRole('button', {
                name: 'Continue to next screen',
            }),
        ).toBeInTheDocument()
    })

    it('should render the button with the provided test id', () => {
        renderMultiScreenNavigationButton({
            testId: 'previous-screen-button',
        })

        expect(screen.getByTestId('previous-screen-button')).toBeInTheDocument()
    })

    it('should render an image when imageUrl is provided', () => {
        const { container } = renderMultiScreenNavigationButton({
            imageUrl: '/img/arrow-left.svg',
        })

        const image = container.querySelector('img')

        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', '/img/arrow-left.svg')
        expect(image).toHaveAttribute('alt', '')
        expect(image).toHaveAttribute('aria-hidden', 'true')
    })

    it('should not render an image when imageUrl is empty', () => {
        const { container } = renderMultiScreenNavigationButton({
            imageUrl: '',
        })

        expect(container.querySelector('img')).not.toBeInTheDocument()
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should call the click callback when the enabled button is clicked', () => {
        const onClickCallback = vi.fn()

        renderMultiScreenNavigationButton({
            onClickCallback,
        })

        fireEvent.click(screen.getByRole('button'))

        expect(onClickCallback).toHaveBeenCalledTimes(1)
    })

    it('should call the click callback for each enabled button click', () => {
        const onClickCallback = vi.fn()

        renderMultiScreenNavigationButton({
            onClickCallback,
        })

        const button = screen.getByRole('button')

        fireEvent.click(button)
        fireEvent.click(button)
        fireEvent.click(button)

        expect(onClickCallback).toHaveBeenCalledTimes(3)
    })

    it('should be enabled by default when disabled is not provided', () => {
        renderMultiScreenNavigationButton()

        const button = screen.getByRole('button')

        expect(button).toBeEnabled()
        expect(button).toHaveAttribute('aria-hidden', 'false')
    })

    it('should be enabled when disabled is false', () => {
        renderMultiScreenNavigationButton({
            disabled: false,
        })

        const button = screen.getByRole('button')

        expect(button).toBeEnabled()
        expect(button).toHaveAttribute('aria-hidden', 'false')
    })

    it('should be disabled when disabled is true', () => {
        renderMultiScreenNavigationButton({
            disabled: true,
        })

        const button = screen.getByRole('button', {
            hidden: true,
        })

        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-hidden', 'true')
    })

    it('should not call the click callback when disabled', () => {
        const onClickCallback = vi.fn()

        renderMultiScreenNavigationButton({
            onClickCallback,
            disabled: true,
        })

        fireEvent.click(
            screen.getByRole('button', {
                hidden: true,
            }),
        )

        expect(onClickCallback).not.toHaveBeenCalled()
    })

    it('should set the image opacity to 0 when disabled', () => {
        const { container } = renderMultiScreenNavigationButton({
            disabled: true,
            imageUrl: '/img/arrow-right.svg',
        })

        const image = container.querySelector('img')

        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('style', 'opacity: 0;')
        expect(image).toHaveAttribute('aria-hidden', 'true')
    })

    it('should not hide the image when enabled', () => {
        const { container } = renderMultiScreenNavigationButton({
            disabled: false,
            imageUrl: '/img/arrow-right.svg',
        })

        const image = container.querySelector('img')

        expect(image).toBeInTheDocument()
        expect(image).not.toHaveAttribute('hidden')
        expect(image).toHaveAttribute('aria-hidden', 'true')
    })

    it('should update rendered attributes when props change', () => {
        const { rerender, container } = render(
            <MultiScreenNavigationButton
                imageUrl="/img/arrow-right.svg"
                onClickCallback={vi.fn()}
                ariaLabel="Continue"
                testId="navigation-button"
                disabled={false}
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Continue',
            }),
        ).toBeEnabled()
        expect(container.querySelector('img')).toHaveAttribute(
            'src',
            '/img/arrow-right.svg',
        )

        rerender(
            <MultiScreenNavigationButton
                imageUrl="/img/arrow-left.svg"
                onClickCallback={vi.fn()}
                ariaLabel="Go back"
                testId="navigation-button"
                disabled={true}
            />,
        )

        const button = screen.getByRole('button', {
            hidden: true,
        })

        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-label', 'Go back')
        expect(button).toHaveAttribute('aria-hidden', 'true')
        expect(container.querySelector('img')).toHaveAttribute(
            'src',
            '/img/arrow-left.svg',
        )
    })
})
