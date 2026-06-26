export async function uploadFileToStorage(uploadUrl: string, file: File) {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    })

    if (!response.ok) {
        throw new Error('Erreur lors de l\'upload du fichier')
    }
}