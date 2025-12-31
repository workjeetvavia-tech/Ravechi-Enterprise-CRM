import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Radio, Volume2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Audio Encoding/Decoding Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveAssistant: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for Audio Contexts and Session
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialization
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const getApiKey = () => {
    try {
      return process.env.API_KEY || '';
    } catch (e) {
      return '';
    }
  };

  const startSession = async () => {
    setError(null);
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API Key is missing. Please configure your environment variables.");
      return;
    }

    try {
      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // 2. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey });

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are a friendly and helpful AI customer support agent for Ravechi Enterprises (a Stationery and IT company in Gujarat). You are fluent in English, Hindi, and Gujarati. You must detect the language the user is speaking and respond in that same language. Be concise and professional.",
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setIsConnected(true);

            // Setup Input Stream Processing
            if (inputAudioContextRef.current && streamRef.current) {
              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                
                // Send data to model
                if (sessionRef.current) {
                    sessionRef.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputAudioContextRef.current) {
                setIsSpeaking(true);
                const ctx = outputAudioContextRef.current;
                
                // Ensure sync
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                try {
                    const audioBuffer = await decodeAudioData(
                        decode(base64Audio),
                        ctx,
                        24000,
                        1
                    );

                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setIsSpeaking(false);
                        }
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                } catch (e) {
                    console.error("Error decoding audio", e);
                }
            }

            // Handle Interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                console.log("Interrupted");
                sourcesRef.current.forEach(source => source.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred. Please try again.");
            stopSession();
          },
          onclose: () => {
            console.log("Session Closed");
            setIsConnected(false);
            setIsSpeaking(false);
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Setup Error:", err);
      setError(err.message || "Failed to start audio session.");
      stopSession();
    }
  };

  const stopSession = () => {
    // 1. Close Session
    if (sessionRef.current) {
       sessionRef.current.then(session => {
           try {
               session.close();
           } catch(e) {
               console.log("Session close error (harmless)", e);
           }
       });
       sessionRef.current = null;
    }

    // 2. Stop Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 3. Close Contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // 4. Reset State
    setIsConnected(false);
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
    sourcesRef.current.clear();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center p-6 bg-slate-50">
      
      {/* Visualizer Circle */}
      <div className="relative mb-12">
        {/* Outer Glow */}
        <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
            isConnected 
            ? isSpeaking 
                ? 'bg-indigo-500/60 scale-125' 
                : 'bg-teal-400/30 scale-110 animate-pulse' 
            : 'bg-slate-300/0'
        }`}></div>

        {/* Main Circle */}
        <div className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl border-4 ${
            isConnected 
            ? 'bg-white border-teal-500' 
            : 'bg-slate-100 border-slate-300'
        }`}>
            {isConnected ? (
                isSpeaking ? (
                    <Volume2 size={64} className="text-indigo-600 animate-bounce" />
                ) : (
                    <Radio size={64} className="text-teal-600 animate-pulse" />
                )
            ) : (
                <MicOff size={64} className="text-slate-400" />
            )}
        </div>

        {/* Status Text */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-64">
             <p className={`text-lg font-semibold ${isConnected ? 'text-slate-800' : 'text-slate-500'}`}>
                {isConnected ? (isSpeaking ? "Speaking..." : "Listening...") : "Ready to Connect"}
             </p>
             {isConnected && (
                 <p className="text-xs text-indigo-600 font-medium mt-1">Fluent in English, Hindi, Gujarati</p>
             )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2 max-w-md">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-6">
        {!isConnected ? (
            <button
                onClick={startSession}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
                <Mic size={24} />
                Start Conversation
            </button>
        ) : (
            <button
                onClick={stopSession}
                className="flex items-center gap-3 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-lg shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95"
            >
                <MicOff size={24} />
                End Call
            </button>
        )}
      </div>
      
      <p className="mt-8 text-sm text-slate-400 max-w-md text-center">
        Powered by Gemini 2.5 Native Audio. Speak naturally to manage your CRM.
      </p>
    </div>
  );
};

export default LiveAssistant;