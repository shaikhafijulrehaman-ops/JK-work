import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Mic, 
  MicOff, 
  Globe, 
  Volume2, 
  CheckCircle,
  MessageSquare,
  Sparkles,
  Play
} from 'lucide-react';

export default function AICallAgent() {
  const { user } = useAuthStore();
  const { fetchBookings } = useBookingStore();
  const { addNotification } = useNotificationStore();

  const [language, setLanguage] = useState('English'); // English, Telugu
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  const [extracted, setExtracted] = useState(null);
  const [voiceReply, setVoiceReply] = useState('');
  const [loading, setLoading] = useState(false);

  // High-fidelity pre-set bilingual voice transcript inputs
  const presets = {
    English: [
      { text: 'I want to book bathroom deep cleaning at Prestige Jindal City flat 402 tomorrow morning.', label: 'Bathroom Deep Cleaning request' },
      { text: 'Need a professional electrician for switchboard and ceiling fan wiring repairs in Anchepalya block D.', label: 'Electrician wiring repair request' },
      { text: 'Can I schedule baby care support tomorrow for 6 hours daily needs package?', label: 'Baby Care daily support request' }
    ],
    Telugu: [
      { text: 'naaku repati kosam bathroom deep cleaning kaavali, Prestige Jindal City flat 402 block B.', label: 'బాత్‌రూమ్ క్లీనింగ్ రిక్వెస్ట్' },
      { text: 'current board and fan and switchboard repair kosam electrician service kaavali Anchepalya pin code 560073.', label: 'ఎలక్ట్రీషియన్ సర్వీస్ రిక్వెస్ట్' },
      { text: 'repati kosam baby care support schedule cheskovali, Anchepalya details ivvandi.', label: 'బేబీ కేర్ రిక్వెస్ట్' }
    ]
  };

  const handleSimulateCall = async (transcriptText) => {
    setLoading(true);
    setExtracted(null);
    setVoiceReply('');

    try {
      const token = localStorage.getItem('jk_token');
      const res = await fetch('/api/ai-agent/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript: transcriptText,
          language
        })
      });
      const data = await res.json();

      if (data.success) {
        setExtracted(data.extractedEntities);
        setVoiceReply(data.voiceResponse);
        
        // Dynamic in-app notification updates
        addNotification(
          language === 'Telugu' ? 'AI బుకింగ్ విజయవంతమైంది!' : 'AI Call Booking Placed!',
          data.voiceResponse,
          'BOOKING_ALERT'
        );

        // Sync Dashboards
        fetchBookings();
      }
    } catch (e) {
      // Show error notification when server is unavailable
      addNotification(
        'Connection Error',
        'Unable to process AI call booking. Please check your connection and try again.',
        'ERROR'
      );
    } finally {
      setLoading(false);
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden font-inter">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(8,145,178,0.2),transparent)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 relative z-10">
        <div className="flex items-center space-x-2.5">
          <span className="flex items-center justify-center w-8 h-8 bg-brand rounded-lg text-white font-poppins font-black text-sm">AI</span>
          <div>
            <h3 className="font-poppins font-black text-xs uppercase tracking-wider text-brand-light flex items-center">
              Optional Add-On: AI Call Agent Simulator <Sparkles className="w-3.5 h-3.5 text-royal-gold ml-1 animate-pulse" />
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Bilingual Telephony Integration Guide (Page 6)</span>
          </div>
        </div>

        {/* Language Select Toggle */}
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-[10px] font-bold text-slate-400">
          <button 
            onClick={() => { setLanguage('English'); setExtracted(null); setVoiceReply(''); }}
            className={`px-2.5 py-1 rounded transition-all ${language === 'English' ? 'bg-brand text-white font-black' : 'bg-transparent text-slate-500'}`}
          >
            English
          </button>
          <button 
            onClick={() => { setLanguage('Telugu'); setExtracted(null); setVoiceReply(''); }}
            className={`px-2.5 py-1 rounded transition-all ${language === 'Telugu' ? 'bg-brand text-white font-black' : 'bg-transparent text-slate-500'}`}
          >
            తెలుగు
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* ==================== LEFT CORE PULSING ORB / PRESETS ==================== */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Preset Phone Voice Transcript
            </h4>
            
            <div className="space-y-2">
              {presets[language].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedPreset(preset.text);
                    setIsRecording(true);
                    setTimeout(() => handleSimulateCall(preset.text), 1500);
                  }}
                  className={`w-full text-left bg-slate-800/80 border hover:border-brand/40 text-[10.5px] p-3 rounded-lg flex items-center justify-between text-slate-300 font-medium transition-colors ${
                    selectedPreset === preset.text ? 'border-brand bg-brand/5' : 'border-slate-800'
                  }`}
                >
                  <span>"{preset.label}"</span>
                  <Play className="w-3.5 h-3.5 text-brand flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Micro Pulsing Orb */}
          <div className="flex items-center space-x-3 bg-slate-800/40 border border-slate-800/50 p-4 rounded-xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
              isRecording ? 'bg-brand text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              <Mic className="w-5 h-5 relative z-10" />
              {isRecording && (
                <>
                  <span className="absolute inset-0 bg-brand rounded-full animate-ping opacity-75"></span>
                  <span className="absolute inset-0 bg-brand rounded-full animate-pulse opacity-50"></span>
                </>
              )}
            </div>
            <div>
              <span className="font-bold text-xs text-slate-200 block">
                {isRecording ? 'Listening and parsing coordinates...' : 'AI Voice Status: Idle'}
              </span>
              <span className="text-[9px] text-slate-400">
                {isRecording ? 'Extracting address & pincode in Chikkabidarakallu...' : 'Select a preset transcript block above to call'}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT SCREEN: NLP EXTRACTION FEED ==================== */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 min-h-[220px] flex flex-col justify-between text-xs space-y-4">
          
          {/* AI Response speech bubble */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 py-10">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400 font-medium">AI parsing call parameters...</span>
            </div>
          ) : voiceReply ? (
            <div className="space-y-4">
              {/* Transcript */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Customer Call Transcript</span>
                <p className="text-[11px] text-slate-300 leading-normal italic bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                  "{selectedPreset}"
                </p>
              </div>

              {/* Speech bubble */}
              <div className="space-y-1">
                <span className="text-[9px] text-brand-light font-bold uppercase tracking-wider flex items-center">
                  <Volume2 className="w-3.5 h-3.5 mr-1 animate-pulse" /> AI Agent Vocal Response
                </span>
                <p className="text-[11px] text-brand-light bg-brand/5 border border-brand/20 p-2.5 rounded-lg leading-relaxed font-semibold">
                  {voiceReply}
                </p>
              </div>

              {/* Extracted JSON specs */}
              {extracted && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5 text-[10px]">
                  <div className="flex items-center space-x-1 font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-brand" /> <span>Parameters Captured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="font-bold text-white">{extracted.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice price:</span>
                    <span className="font-bold text-brand">Rs. {extracted.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Doorstep coordinates:</span>
                    <span className="font-bold text-slate-300 truncate max-w-[140px]">{extracted.address}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-700" />
              <span className="text-slate-500 font-medium">Bilingual Speech Terminal</span>
              <p className="text-[10px] text-slate-600 max-w-[200px] leading-relaxed">
                Click one of the call transcripts on the left. The AI Call Agent parses the details, books the job in Anchepalya, and replies in Telugu/English!
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
