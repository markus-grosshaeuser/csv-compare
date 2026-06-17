import Style from './MultiScreenNavigationButton.module.css'

export type MultiScreenNavigationButtonProps = {
    imageUrl: string
    onClickCallback: () => void
    ariaLabel: string
    testId: string
    disabled?: boolean
}

export default function MultiScreenNavigationButton({
    imageUrl,
    onClickCallback,
    ariaLabel,
    testId,
    disabled,
}: MultiScreenNavigationButtonProps) {
    return (
        <button
            className={Style.button}
            onClick={onClickCallback}
            data-testid={testId}
            aria-label={ariaLabel}
            aria-hidden={disabled ?? false}
            disabled={disabled ?? false}
        >
            {imageUrl == '' ? (
                ''
            ) : (
                <img
                    alt=""
                    src={imageUrl}
                    aria-hidden="true"
                    style={{ opacity: disabled ? 0 : 1 }}
                />
            )}
        </button>
    )
}
