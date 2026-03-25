import api from "./api";

export interface AIChatRequest {
  message: string;
  projectId: string;
  currentFilePath: string;
  selectedCode?: string;
}
export interface AIChatResponse {
  reply: string;
}

export async function sendAIMessage(
  req: AIChatRequest
): Promise<AIChatResponse> {
  const res = await api.post<{ status: number; message: string; data: AIChatResponse }>(
    "/ai/chat",
    req
  );
  return res.data.data;
}