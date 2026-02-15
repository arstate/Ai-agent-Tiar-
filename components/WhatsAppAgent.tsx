
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { generateAgentResponse } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileHelpers';
import { Send, Image as ImageIcon, Copy, RefreshCcw, UserCircle, Bot, X, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

const WhatsAppAgent: React.FC = () => {
  const { memories, settings, apiKeys } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'ai',
    text: `Hello! I am your ${settings.role}. Send me a client message and I will analyze it using ${memories.length} memories via Gemini 2.5 Flash.`,
    timestamp: Date.now()
  }]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputText,
      timestamp: Date.now(),
      attachment: selectedImage ? { type: 'image', content: previewUrl! } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    const imageToProcess = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setPreviewUrl(null);

    try {
      let base64Image = null;
      if (imageToProcess) base64Image = await fileToBase64(imageToProcess);

      const reply = await generateAgentResponse(
        userMessage.text,
        base64Image,
        memories,
        settings,
        apiKeys
      );

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Error generating response. Please check your API Keys in Settings.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
             <Bot className="w-6 h-6 text-primary-400" />
             <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div>
            <h2 className="font-semibold text-white">WhatsApp Assistant</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{settings.role}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
           <Sparkles className="w-3 h-3 text-yellow-500" />
           <span>Rotated Keys: {apiKeys.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-primary-600' : 'bg-purple-600'}`}>
                {msg.sender === 'user' ? <UserCircle className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className={`p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700 shadow-xl'}`}>
                {msg.attachment?.type === 'image' && (
                  <img src={msg.attachment.content} alt="Attachment" className="mb-3 rounded-lg border border-white/10 max-h-64 object-cover" />
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start items-center space-x-3">
             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center animate-pulse"><Bot className="w-5 h-5 text-white" /></div>
             <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700 flex space-x-1">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md">
        {previewUrl && (
           <div className="mb-3 relative inline-block">
             <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-xl border-2 border-primary-500 shadow-lg" />
             <button onClick={() => {setSelectedImage(null); setPreviewUrl(null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors">
               <X className="w-3 h-3" />
             </button>
           </div>
        )}
        <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded-2xl border border-gray-700 focus-within:border-primary-500 transition-all duration-200">
          <label className="p-2.5 text-gray-400 hover:text-white cursor-pointer hover:bg-gray-700 rounded-xl transition-all">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <ImageIcon className="w-5 h-5" />
          </label>
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none px-2 text-sm"
            placeholder="Type a message or paste a screenshot..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isProcessing}
            className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-lg"
          >
            {isProcessing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAgent;
