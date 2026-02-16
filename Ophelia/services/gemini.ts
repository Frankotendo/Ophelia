
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Global Audio State to manage playback context
let globalAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume();
  }
  return globalAudioContext;
};

// Only call this when explicitly interrupting the AI (e.g. new user message)
export const syncStopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.onended = null;
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

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(chunkText);
    }

    return { text: fullText };
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    return { text: "Signal disruption detected. Student Teacher, please recalibrate your inquiry." };
  }
};

export const getTutorResponse = async (
  userMessage: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  media?: { data: string, mimeType: string }
) => {
  const userParts: any[] = [{ text: userMessage }];
  if (media) {
    userParts.push({
      inlineData: {
        data: media.data,
        mimeType: media.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: userParts }],
    config: { systemInstruction: SYSTEM_INSTRUCTION }
  });

  return { 
    text: response.text || "",
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

const sanitizeForTTS = (text: string): string => {
  return text
    .replace(/[#*_~`\[\]()]/g, '') 
    .replace(/\[PAUSE\]/g, ', ')     
    .replace(/\[SEGMENT\]/g, '. ')
    .replace(/BEGIN_BOARD[\s\S]*?END_BOARD/g, '')
    .replace(/\[ADD_COURSE:[\s\S]*?\]/g, '')
    .replace(/\s+/g, ' ')          
    .trim();
};

export const getTutorSpeech = async (text: string) => {
  const cleanText = sanitizeForTTS(text);
  if (!cleanText || cleanText.length < 2) return null;

  try {
    const response = await ai.models.generateContent({
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
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) return { audioData };
    throw new Error("TTS Fail");
  } catch (error) {
    // Fallback to professional system voice
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v => (v.name.includes('Male') || v.name.includes('David')) && v.lang.startsWith('en'));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    return null;
  }
};

export async function playAudioBase64(base64Data: string) {
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
