import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { generateAgentResponse } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileHelpers';
import { Send, Image as ImageIcon, Copy, RefreshCcw, Settings as SettingsIcon, UserCircle, Bot, X } from 'lucide-react';
import { ChatMessage } from '../types';

const WhatsAppAgent: React.FC = () => {
  const { memories, settings, updateSettings } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    sender: 'ai',
    text: `Hello! I am your ${settings.role}. Send me a WhatsApp message or screenshot from a client, and I will draft a response based on the ${memories.length} items in my knowledge base.`,
    timestamp: Date.now()
  }]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputText,
      timestamp: Date.now(),
      attachment: selectedImage ? {
        type: 'image',
        content: previewUrl!
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Clear input immediately for better UX
    setInputText('');
    const imageToProcess = selectedImage;
    clearImage(); // Clear preview

    try {
      let base64Image = null;
      if (imageToProcess) {
        base64Image = await fileToBase64(imageToProcess);
      }

      const reply = await generateAgentResponse(
        userMessage.text,
        base64Image,
        memories,
        settings
      );

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: reply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Sorry, I encountered an error generating the response. Please check the API key or try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Response copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-gray-900/90 z-20 flex justify-end backdrop-blur-sm">
          <div className="w-full md:w-96 bg-gray-900 border-l border-gray-800 h-full p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Agent Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Agent Role</label>
                <input 
                  type="text" 
                  value={settings.role}
                  onChange={(e) => updateSettings({ role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Customer Support"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tone</label>
                <input 
                  type="text" 
                  value={settings.tone}
                  onChange={(e) => updateSettings({ tone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Professional, Friendly"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                <input 
                  type="text" 
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. English, Indonesian"
                />
              </div>
              <div className="p-4 bg-primary-900/20 border border-primary-500/30 rounded-lg">
                <p className="text-xs text-primary-300">
                  Tip: The agent uses all available memories to formulate responses. Ensure your Knowledge Base is up to date.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="font-semibold text-white">WhatsApp Assistant</h2>
            <p className="text-xs text-gray-400">Acting as: {settings.role}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.sender === 'user' ? 'bg-primary-600' : 'bg-purple-600'
              }`}>
                {msg.sender === 'user' ? <UserCircle className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`group relative p-4 rounded-2xl ${
                msg.sender === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700 shadow-sm'
              }`}>
                {msg.attachment && msg.attachment.type === 'image' && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                    <img src={msg.attachment.content} alt="Attachment" className="max-w-full h-auto" />
                  </div>
                )}
                
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {msg.sender === 'ai' && (
                  <button 
                    onClick={() => copyToClipboard(msg.text)}
                    className="absolute -bottom-6 left-0 text-xs text-gray-500 hover:text-white flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
             <div className="flex max-w-[70%] flex-row space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700 flex items-center space-x-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        {previewUrl && (
           <div className="mb-3 relative inline-block">
             <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-700" />
             <button onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600">
               <X className="w-3 h-3" />
             </button>
           </div>
        )}
        <div className="flex items-center space-x-3 bg-gray-800 p-2 rounded-xl border border-gray-700 focus-within:border-primary-500 transition-colors">
          <label className="p-2 text-gray-400 hover:text-white cursor-pointer hover:bg-gray-700 rounded-lg transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <ImageIcon className="w-5 h-5" />
          </label>
          <input
            type="text"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none px-2"
            placeholder="Type context or paste WA message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isProcessing}
            className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Upload a screenshot of the WhatsApp chat for context, or paste the text directly.
        </p>
      </div>
    </div>
  );
};

export default WhatsAppAgent;