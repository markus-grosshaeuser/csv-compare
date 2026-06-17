import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from 'vitest'
import { provideFileDownload } from '../../src/utilities/FileDownloadProvider'

describe('File: FileDownloadProvider.ts', () => {
    const objectUrl = 'blob:mock-url'

    let createObjectURLSpy: ReturnType<typeof vi.spyOn>
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
    let appendChildSpy: ReturnType<typeof vi.spyOn>
    let removeChildSpy: ReturnType<typeof vi.spyOn>
    let clickSpy: Mock<() => void>

    beforeEach(() => {
        clickSpy = vi.fn(() => {})

        createObjectURLSpy = vi
            .spyOn(URL, 'createObjectURL')
            .mockReturnValue(objectUrl)

        revokeObjectURLSpy = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation(() => {})

        appendChildSpy = vi.spyOn(document.body, 'appendChild')
        removeChildSpy = vi.spyOn(document.body, 'removeChild')

        vi.spyOn(document, 'createElement').mockImplementation(
            (tagName: string) => {
                const element = document.createElementNS(
                    'http://www.w3.org/1999/xhtml',
                    tagName,
                ) as HTMLAnchorElement

                element.click = clickSpy

                return element
            },
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    it('creates a CSV blob and object URL for the provided content', async () => {
        const content = 'name,age\nAlice,30'

        provideFileDownload(content, 'users.csv')

        expect(createObjectURLSpy).toHaveBeenCalledOnce()

        const blob = createObjectURLSpy.mock.calls[0][0] as Blob

        expect(blob).toBeInstanceOf(Blob)
        expect(blob.type).toBe('text/csv')
        expect(await blob.text()).toBe(content)
    })

    it('configures a temporary download link with the object URL and file name', () => {
        provideFileDownload('a,b,c', 'export.csv')

        const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement

        expect(link.href).toBe(objectUrl)
        expect(link.download).toBe('export.csv')
    })

    it('appends the temporary link, clicks it, and removes it again', () => {
        provideFileDownload('a,b,c', 'export.csv')

        const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement

        expect(appendChildSpy).toHaveBeenCalledWith(link)
        expect(clickSpy).toHaveBeenCalledOnce()
        expect(removeChildSpy).toHaveBeenCalledWith(link)
        expect(document.body.contains(link)).toBe(false)
    })

    it('revokes the created object URL after triggering the download', () => {
        provideFileDownload('a,b,c', 'export.csv')

        expect(revokeObjectURLSpy).toHaveBeenCalledOnce()
        expect(revokeObjectURLSpy).toHaveBeenCalledWith(objectUrl)
    })

    it('uses the provided file name as the download name', () => {
        provideFileDownload('some,csv,content', 'custom-file-name.csv')

        const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement

        expect(link.download).toBe('custom-file-name.csv')
    })
})
