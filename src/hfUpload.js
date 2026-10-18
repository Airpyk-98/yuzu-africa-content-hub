import { uploadFiles } from '@huggingface/hub';

const HF_REPO = 'epic98/yuzu-africa-content-assets';
const DEFAULT_HF_TOKEN = import.meta.env.VITE_HF_TOKEN || '';

export async function uploadAssetToHuggingFace(fileOrBlob, dateStr, platform, customFileName = '') {
  const token = DEFAULT_HF_TOKEN;
  if (!token) {
    throw new Error('Hugging Face write token missing.');
  }

  const rawName = customFileName || fileOrBlob.name || `asset_${Date.now()}.webm`;
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const cleanPlatform = (platform || 'general').toLowerCase().replace(/\s+/g, '-');
  const pathInRepo = `posts/${dateStr}/${cleanPlatform}_${timestamp}_${safeName}`;

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
        content: fileOrBlob,
      },
    ],
    commitTitle: `Upload ${cleanPlatform} asset for ${dateStr}: ${safeName}`,
  });

  const fileUrl = `https://huggingface.co/datasets/${HF_REPO}/resolve/main/${pathInRepo}`;
  return {
    fileUrl,
    fileName: rawName,
    fileType: fileOrBlob.type || 'application/octet-stream',
    repoUrl: `https://huggingface.co/datasets/${HF_REPO}`,
  };
}
