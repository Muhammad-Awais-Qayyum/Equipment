export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert file to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Please select an image file' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: 'Image must be less than 5MB' };
    }

    return { valid: true };
}

export async function uploadImage(file: File): Promise<string> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
    }

    return fileToBase64(file);
}

export function getImageUrl(imageData: string | null | undefined): string | null {
    if (!imageData) return null;
    if (imageData.startsWith('data:')) {
        return imageData;
    }
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        return imageData;
    }
    return imageData;
}

