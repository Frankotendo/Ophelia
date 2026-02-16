
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Global Audio State to prevent overlapping
let globalAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return globalAudioContext;
};

// Utility for exponential backoff retries to handle 429 RESOURCE_EXHAUSTED errors
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const status = error?.status;
      
      // If it's a rate limit error (429) or quota exhausted, wait and retry
      if (
        status === 429 || 
        errorMsg.includes('429') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('quota')
      ) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Quota hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const syncStopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch (e) {}
    currentSource = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const getTutorResponseStream = async (userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], onChunk: (text: string) => void) => {
  try {
    const contents = [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const result = await withRetry(() => ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
        topP: 0.95,
      },
    }));

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(chunkText);
    }

    return { text: fullText };
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    let errorMsg = "Oh, my precious heart Ophelia, Auntie had a tiny connection flicker. Let's try again, my love.";
    
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      errorMsg = "My beautiful student, Auntie is just taking a tiny breath because so many students are asking for her help right now! She needs a small rest to clean her chalkboard. Wait just a small moment and ask me again, my shining star!";
    }
    
    return { text: errorMsg };
  }
};

export const getTutorResponse = async (
  userMessage: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  media?: { data: string, mimeType: string }
) => {
  try {
    const userParts: any[] = [{ text: userMessage }];
    if (media) {
      userParts.push({
        inlineData: {
          data: media.data,
          mimeType: media.mimeType
        }
      });
    }

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: 'user', parts: userParts }],
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    }));

    return { 
      text: response.text || "",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error: any) {
    console.error("Gemini Response Error:", error);
    let errorMsg = "Auntie Efua is resting her voice, my love. Try again soon.";
    
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      errorMsg = "My dear Ophelia, Auntie needs a quick sip of water while her chalkboard is being cleaned. Just a moment, my precious heartbeat! I'll be ready for you very soon.";
    }
    
    return { text: errorMsg };
  }
};

const sanitizeForTTS = (text: string): string => {
  return text
    .replace(/[#*_~`\[\]()]/g, '') 
    .replace(/\[PAUSE\]/g, '')     
    .replace(/\[SEGMENT\]/g, '')
    .replace(/BEGIN_BOARD[\s\S]*?END_BOARD/g, '')
    .replace(/\s+/g, ' ')          
    .trim();
};

export const getTutorSpeech = async (text: string) => {
  const cleanText = sanitizeForTTS(text);
  if (!cleanText) return null;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: 'Kore' 
            } 
          },
        },
      },
    }));

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) return { audioData };
    throw new Error("TTS Fail");
  } catch (error) {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      const femaleVoice = voices.find(v => 
        (v.name.includes('Female') || 
         v.name.includes('Google UK English Female') || 
         v.name.includes('Samantha') || 
         v.name.includes('Victoria') || 
         v.name.includes('Karen')) && 
        v.lang.startsWith('en')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.2; 
      utterance.pitch = 1.3; 
      window.speechSynthesis.speak(utterance);
    }
    return null;
  }
};

export async function playAudioBase64(base64Data: string) {
  syncStopAudio(); 
  
  const ctx = getAudioContext();
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  
  currentSource = source;
  source.start();
  
  return source;
}
