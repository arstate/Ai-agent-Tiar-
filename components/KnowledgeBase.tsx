import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { analyzeContent } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileHelpers';
import { MemoryItem } from '../types';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2, FileType, BrainCircuit } from 'lucide-react';

const KnowledgeBase: React.FC = () => {
  const { memories, addMemory, removeMemory } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

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
        await processSingleFile(file);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // We continue processing other files even if one fails
      }
      completed++;
    }

    setIsAnalyzing(false);
    setProcessingStatus('');
  };

  const processSingleFile = async (file: File) => {
    let type: 'text' | 'image' | 'pdf' = 'text';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type === 'application/pdf') type = 'pdf';
    else if (file.type.startsWith('text/')) type = 'text';

    const base64Content = await fileToBase64(file);
    
    // Call Gemini to analyze
    const summary = await analyzeContent(type, base64Content, file.type);

    const newMemory: MemoryItem = {
      id: crypto.randomUUID(),
      type,
      name: file.name,
      content: base64Content,
      summary,
      timestamp: Date.now()
    };

    addMemory(newMemory);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
        <p className="text-gray-400">Teach your AI agent by uploading documents, images, or text files. The AI automatically interprets, translates, and memorizes this data.</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }`}
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
          multiple // Allow multiple files
          disabled={isAnalyzing}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          {isAnalyzing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-lg font-medium text-white">Processing...</p>
                <p className="text-sm text-primary-400 font-mono">{processingStatus}</p>
              </div>
              <p className="text-sm text-gray-400">Gemini is learning from your data.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                <UploadCloud className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-xl font-semibold text-white">Click to upload or drag & drop</p>
              <p className="text-gray-400">Select unlimited PDF, Images, or Text files</p>
            </>
          )}
        </div>
      </div>

      {/* Memory Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <BrainCircuit className="w-5 h-5 mr-2 text-purple-400" />
          Active Memories ({memories.length})
        </h2>
        
        {memories.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-xl border border-gray-800">
            <p className="text-gray-500">No memories yet. Upload data to train your agent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((mem) => (
              <div key={mem.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors shadow-lg flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-gray-700 rounded-lg shrink-0">
                      {mem.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-400" />}
                      {mem.type === 'pdf' && <FileType className="w-4 h-4 text-red-400" />}
                      {mem.type === 'text' && <FileText className="w-4 h-4 text-blue-400" />}
                    </div>
                    <span className="font-medium truncate text-gray-200" title={mem.name}>{mem.name}</span>
                  </div>
                  <button 
                    onClick={() => removeMemory(mem.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 space-y-3 flex-1">
                  <div className="max-h-40 overflow-y-auto text-sm text-gray-400 pr-1 custom-scrollbar">
                    <p className="font-semibold text-gray-500 text-xs uppercase mb-1 tracking-wider">Learned Data</p>
                    {mem.summary}
                  </div>
                </div>
                
                <div className="p-3 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-600 bg-gray-900/30">
                   <span>{new Date(mem.timestamp).toLocaleDateString()}</span>
                   <span className="bg-gray-700/50 px-2 py-1 rounded text-gray-400 uppercase tracking-wide text-[10px]">{mem.type}</span>
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