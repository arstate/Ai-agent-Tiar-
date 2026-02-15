
import React, { useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { analyzeContent } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileHelpers';
import { MemoryItem } from '../types';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2, FileType, BrainCircuit, Camera, X, CheckCircle2 } from 'lucide-react';

const KnowledgeBase: React.FC = () => {
  const { memories, addMemory, removeMemory, apiKeys } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      
      // Stop stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);

      processTakenPhoto(base64);
    }
  };

  const processTakenPhoto = async (base64: string) => {
    setIsAnalyzing(true);
    setProcessingStatus("Learning from photo...");
    try {
      const summary = await analyzeContent('image', base64, apiKeys, 'image/png');
      const newMemory: MemoryItem = {
        id: crypto.randomUUID(),
        type: 'image',
        name: `Snapshot_${new Date().toLocaleTimeString()}.png`,
        content: base64,
        summary,
        timestamp: Date.now()
      };
      await addMemory(newMemory);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
      setProcessingStatus('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsAnalyzing(true);
    let completed = 0;
    const total = files.length;

    for (const file of files) {
      setProcessingStatus(`Analyzing ${completed + 1}/${total}: ${file.name}`);
      try {
        let type: 'text' | 'image' | 'pdf' = 'text';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('text/')) type = 'text';

        const base64Content = await fileToBase64(file);
        const summary = await analyzeContent(type, base64Content, apiKeys, file.type);

        const newMemory: MemoryItem = {
          id: crypto.randomUUID(),
          type,
          name: file.name,
          content: base64Content,
          summary,
          timestamp: Date.now()
        };

        await addMemory(newMemory);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
      completed++;
    }

    setIsAnalyzing(false);
    setProcessingStatus('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-primary-400">
             <BrainCircuit className="w-6 h-6" />
             <span className="text-sm font-bold uppercase tracking-widest">Intelligence Training</span>
          </div>
          <h1 className="text-4xl font-black text-white">Knowledge Brain</h1>
          <p className="text-gray-400 max-w-2xl">Upload documents, images, or take photos. The agent will analyze and "learn" from them to better assist your clients.</p>
        </div>
        <button 
          onClick={startCamera}
          className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-2xl border border-gray-700 transition-all active:scale-95 shadow-lg"
        >
          <Camera className="w-5 h-5 text-primary-400" />
          <span className="font-semibold">Take Photo</span>
        </button>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button onClick={() => setShowCamera(false)} className="absolute top-6 right-6 text-white p-2 bg-gray-800 rounded-full">
            <X className="w-8 h-8" />
          </button>
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[70vh] rounded-3xl border-2 border-primary-500 shadow-2xl" />
          <button 
            onClick={capturePhoto}
            className="mt-8 w-20 h-20 bg-white rounded-full border-8 border-gray-400/50 hover:bg-gray-100 transition-all active:scale-90"
          />
          <p className="mt-4 text-gray-400 font-medium">Position document clearly in frame</p>
        </div>
      )}

      <div 
        className={`relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500 ${
          dragActive ? 'border-primary-500 bg-primary-500/10 scale-[1.01]' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
        } ${isAnalyzing ? 'animate-pulse-slow' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.txt,.md"
          multiple
          disabled={isAnalyzing}
        />
        <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none">
          {isAnalyzing ? (
            <div className="space-y-4">
              <div className="relative">
                 <Loader2 className="w-20 h-20 text-primary-500 animate-spin" />
                 <BrainCircuit className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white tracking-tight">AI is Learning...</p>
                <p className="text-sm text-primary-400 font-mono bg-primary-500/10 px-4 py-1 rounded-full border border-primary-500/20">{processingStatus}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] flex items-center justify-center mb-2 shadow-2xl border border-gray-700">
                <UploadCloud className="w-10 h-10 text-primary-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white">Drop data to expand the brain</p>
                <p className="text-gray-500">Support for PDF, JPG, PNG, and Text files</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-500" />
            Active Memories
            <span className="ml-3 px-3 py-1 bg-gray-800 rounded-full text-xs font-mono text-gray-400 border border-gray-700">{memories.length} nodes</span>
          </h2>
        </div>
        
        {memories.length === 0 ? (
          <div className="text-center py-32 bg-gray-900/40 rounded-[2.5rem] border border-gray-800/50 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gray-800 rounded-2xl"><FileType className="w-8 h-8 text-gray-600" /></div>
            <p className="text-gray-500 font-medium">The knowledge base is empty.<br/>Upload data to start training your AI Agent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((mem) => (
              <div key={mem.id} className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden hover:border-primary-500/50 hover:bg-gray-800 transition-all duration-300 shadow-xl flex flex-col h-80">
                <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/30">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      mem.type === 'image' ? 'bg-pink-500/10 text-pink-400' :
                      mem.type === 'pdf' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {mem.type === 'image' && <ImageIcon className="w-5 h-5" />}
                      {mem.type === 'pdf' && <FileType className="w-5 h-5" />}
                      {mem.type === 'text' && <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-sm text-gray-100 truncate">{mem.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">{new Date(mem.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => removeMemory(mem.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center space-x-2 text-xs font-bold text-primary-400 uppercase tracking-widest mb-1">
                    <BrainCircuit className="w-3 h-3" />
                    <span>Extracted Knowledge</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{mem.summary}</p>
                </div>
                <div className="px-6 py-4 bg-gray-900/20 border-t border-gray-700/30">
                   <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 w-full opacity-50"></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
