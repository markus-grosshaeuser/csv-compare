import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

export const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
export const mockRevokeObjectURL = vi.fn()

HTMLAnchorElement.prototype.click = vi.fn()
