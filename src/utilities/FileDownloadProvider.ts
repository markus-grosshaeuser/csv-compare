/**
 * Creates and triggers the download of a file with the specified content and file name.
 *
 * @param {string} content - The text content to be saved in the file.
 * @param {string} fileName - The name of the file to download.
 * @return {void} This method does not return a value.
 */

export function provideFileDownload(content: string, fileName: string): void {
    const file = new Blob([content], { type: 'text/csv' })
    const fileTempLink = document.createElement('a')
    const temporaryFileURL = URL.createObjectURL(file)
    fileTempLink.href = temporaryFileURL
    fileTempLink.download = fileName
    document.body.appendChild(fileTempLink)
    fileTempLink.click()
    document.body.removeChild(fileTempLink)
    URL.revokeObjectURL(temporaryFileURL)
}
