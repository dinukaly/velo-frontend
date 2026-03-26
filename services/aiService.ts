import api from "./api";

export interface AIChatRequest {
  message: string;
  projectId: string;
  fileId: string;
  currentFilePath?: string;
  selectedCode?: string;
}
export interface AIChatResponse {
  reply: string;
}

export async function sendAIMessage(
  req: AIChatRequest
): Promise<AIChatResponse> {
  const res = await api.post<AIChatResponse>(
    "/ai/chat",
    req
  );
  return res.data;
}