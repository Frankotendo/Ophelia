
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTutorResponseStream = async (userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], onChunk: (text: string) => void) => {
  try {
    const contents = [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
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
    return { text: "Oh, my precious heart Ophelia, Auntie had a tiny connection flicker. Let's try again, my love." };
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
    model: "gemini-3-flash-preview",
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.rate = 1.1; 
      utterance.pitch = 1.4;
      window.speechSynthesis.speak(utterance);
    }
    return null;
  }
};

export async function playAudioBase64(base64Data: string) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}
