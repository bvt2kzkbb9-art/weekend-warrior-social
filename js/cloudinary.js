export const CLOUDINARY_CLOUD_NAME = 'TWOJ_CLOUD_NAME';
export const CLOUDINARY_UPLOAD_PRESET = 'weekend-warrior';

export async function uploadToCloudinary(file, folder = 'wws') {
const formData = new FormData();

formData.append('file', file);
formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
formData.append('folder', folder);

const response = await fetch(
`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
{
method: 'POST',
body: formData
}
);

if (!response.ok) {
throw new Error('Cloudinary upload failed');
}

const data = await response.json();

return {
url: data.secure_url,
publicId: data.public_id
};
}
