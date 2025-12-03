import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { SYSTEM_PROMPT } from "../utils/constants";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface AnalysisOptions {
  customInstruction?: string;
  targetDuration: '10s' | '15s' | '25s' | '60s' | '3m' | '5m';
  avoidQuotes?: string[]; // New: List of quotes to avoid repeating
}

const generateWithRetry = async (ai: GoogleGenAI, params: any, retries = 2): Promise<any> => {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('Rpc failed') || error.message?.includes('503'))) {
      console.warn(`Retrying request... attempts left: ${retries}`);
      await new Promise(res => setTimeout(res, 2000)); // Wait 2s
      return generateWithRetry(ai, params, retries - 1);
    }
    throw error;
  }
};

export const analyzeVideoAndGenerateQuotes = async (
  videoFile: File | null, 
  options: AnalysisOptions
): Promise<AnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build the prompt parts
    const parts: any[] = [];
    let prompt = "";

    // If video exists, add it to parts
    if (videoFile) {
      const base64Video = await blobToBase64(videoFile);
      parts.push({
        inlineData: {
          mimeType: videoFile.type,
          data: base64Video
        }
      });
      prompt += "请分析这段视频的音频/旁白内容。\n1. 提供视频内容的逐字稿或详细摘要。\n2. 基于视频内容，创作3句'大承活法'风格的扎心语录。";
    } else {
      // Text only mode
      prompt += "请基于用户提供的主题，创作3句'大承活法'风格的扎心语录。";
    }
    
    // Add Custom Instruction
    if (options.customInstruction && options.customInstruction.trim() !== "") {
      prompt += `\n\n【用户自定义主题】：请重点结合主题 "${options.customInstruction}" 进行创作。`;
    } else if (!videoFile) {
      // If no video AND no custom instruction, we need a fallback, though UI prevents this.
      prompt += `\n\n【创作主题】：请自由发挥，关于成年人的生活压力，房贷，车贷，工作。`;
    }

    // Add Duration/Length logic - Updated to match user's sample text length (approx 300 chars for 60s)
    const durationMap = {
      '10s': "极短（读完约10秒），适合短视频标题，一针见血，20字左右。",
      '15s': "短句（读完约15秒），适合金句卡片，35字左右。",
      '25s': "中长句（读完约25秒），适合口播文案，60字左右，有情绪铺垫。",
      '60s': "长独白（读完约60秒），字数请务必参考“房贷”参考文案，约300字左右，深度剖析。",
      '3m': "深度长文（读完约3分钟），800字左右，层层递进，直击痛点，类似于一篇完整的社会观察小作文。",
      '5m': "纪录片式超长独白（读完约5分钟），1500字以上，宏大叙事与微观痛苦结合，极度扎心，细节丰富。"
    };
    prompt += `\n\n【时长要求】：${durationMap[options.targetDuration] || "适中长度"}`;

    // Add Avoidance Logic
    if (options.avoidQuotes && options.avoidQuotes.length > 0) {
        prompt += `\n\n【禁止重复】：请务必【不要】生成与以下内容雷同的语录，必须尝试新的切入点、风格或修辞：\n${JSON.stringify(options.avoidQuotes)}`;
    }

    parts.push({ text: prompt });

    // Use retry logic for stability
    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING, description: "Transcription of the video, or summary of the theme if no video provided" },
            generatedQuotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 generated heart-wrenching quotes"
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};