import { setupServer, type SetupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export function reInitiateMockServer(
    fileName: string,
    content: string,
): SetupServer {
    const restHandlers = [
        http.get(`/${fileName}`, () => {
            return HttpResponse.text(content)
        }),
    ]

    const server = setupServer(...restHandlers)
    server.listen({ onUnhandledRequest: 'error' })
    return server
}
