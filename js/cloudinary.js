const CLOUD_NAME = 'dxanfwb3l';
const UPLOAD_PRESET = 'wws_upload';

export async function uploadImage(file) {
  const fd = new FormData();

  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: fd
    }
  );

  if (!res.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await res.json();

  return data.secure_url;
}
