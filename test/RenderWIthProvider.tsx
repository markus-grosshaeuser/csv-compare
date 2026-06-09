import type { ReactElement } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import fileReducer from '../src/redux/fileSlice'
import { render } from '@testing-library/react'

type RenderOptions = {
    preloadedState?: unknown
    route?: string
}

export function renderWithProviders(
    ui: ReactElement,
    { preloadedState, route = '/' }: RenderOptions = {},
) {
    const store = configureStore({
        reducer: {
            file: fileReducer,
        },
        preloadedState,
    })
    window.history.pushState({}, 'Test page', route)
    return {
        store,
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </Provider>,
        ),
    }
}
