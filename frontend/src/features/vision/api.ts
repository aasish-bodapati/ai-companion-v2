import api from '@/lib/api';

export interface VisionAnalyzeIn {
  image_url?: string;
  upload_id?: string;
  image_b64?: string; // raw base64
  prompt?: string;
  model?: string;
}

export interface VisionAnalyzeOut {
  text: string;
}

export async function analyzeImage(body: VisionAnalyzeIn): Promise<VisionAnalyzeOut> {
  return api.post<VisionAnalyzeOut>('/vision/analyze', body);
}
