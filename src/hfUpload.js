import { uploadFiles } from '@huggingface/hub';

const HF_REPO = 'epic98/yuzu-africa-content-assets';
// Default token from environment or fallback for instant client-side upload
const DEFAULT_HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '';

export async function uploadAssetToHuggingFace(file, dateStr, platform, customToken = '') {
  const token = customToken || DEFAULT_HF_TOKEN;
  if (!token) {
    throw new Error('Hugging Face write token missing.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const pathInRepo = `posts/${dateStr}/${platform.toLowerCase().replace(/\s+/g, '-')}_${timestamp}_${safeName}`;

  await uploadFiles({
    repo: {
      type: 'dataset',
      name: HF_REPO,
    },
    credentials: {
      accessToken: token,
    },
    files: [
      {
        path: pathInRepo,
        content: file,
      },
    ],
    commitTitle: `Upload ${platform} asset for ${dateStr}: ${safeName}`,
  });

  const fileUrl = `https://huggingface.co/datasets/${HF_REPO}/resolve/main/${pathInRepo}`;
  return {
    fileUrl,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    repoUrl: `https://huggingface.co/datasets/${HF_REPO}`,
  };
}
