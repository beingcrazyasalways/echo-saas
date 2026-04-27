'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Send, Sparkles, X, Volume2, VolumeX, Upload, FileText } from 'lucide-react';

function ChatUI({
  currentEmotion,
  onEmotionChange,
  onClose,
  onOpenVoiceMode,
  tasks = [],
  behaviorPatterns = null,
  userProfile = null,
  onSuggestionUpdate,
  onAddTask,
  onDeleteTask,
  userEmail,
  userId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [documentContext, setDocumentContext] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [processingDocument, setProcessingDocument] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const shouldUseStructuredAssistant = Boolean(
    onSuggestionUpdate || onAddTask || onDeleteTask || behaviorPatterns || userProfile || tasks.length
  );

  const executeAssistantAction = async (action) => {
    if (!action || !action.type) {
      return null;
    }

    if (action.type === 'add_task') {
      if (onAddTask && action.title) {
        const createdTask = await onAddTask(action.title, action.priority || 'medium');
        if (createdTask) {
          return `Task added: "${createdTask.title}".`;
        }
      }
      return action.title ? `Suggested task: "${action.title}".` : null;
    }

    if (action.type === 'delete_task') {
      if (onDeleteTask && action.title) {
        const deletedTask = await onDeleteTask(action.title);
        if (deletedTask) {
          return `Task removed: "${deletedTask.title}".`;
        }
      }
      return action.title ? `Task to remove: "${action.title}".` : null;
    }

    return null;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Check if user is responding to document options
      if (documentContext && extractedText) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Handle document actions
        if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
          await handleDocumentAction('summarize');
          setLoading(false);
          return;
        }
        
        if (lowerMessage.includes('task') || lowerMessage.includes('extract task')) {
          await handleDocumentAction('extract_tasks');
          setLoading(false);
          return;
        }
        
        if (lowerMessage.includes('txt') || lowerMessage.includes('text file')) {
          await handleDocumentAction('convert_txt');
          setLoading(false);
          return;
        }
        
        if (lowerMessage.includes('pdf')) {
          await handleDocumentAction('convert_pdf');
          setLoading(false);
          return;
        }

        if (lowerMessage === 'preview' || lowerMessage.includes('show text')) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Full extracted text:\n\n${extractedText}` 
          }]);
          setLoading(false);
          return;
        }
      }

      // Get stress level from localStorage or default
      const stressLevel = localStorage.getItem('stressLevel') || null;

      const taskLoad = Array.isArray(tasks)
        ? tasks.filter((task) => !task.completed).length
        : 0;

      // Build message with document context if available
      let finalMessage = userMessage;
      if (documentContext && extractedText) {
        finalMessage = `[Document Context: ${documentContext.name}]\n\n${extractedText}\n\nUser Request: ${userMessage}`;
      }

      const endpoint = shouldUseStructuredAssistant ? '/api/ai' : '/api/ai-chat';
      const payload = shouldUseStructuredAssistant
        ? {
            message: finalMessage,
            tasks,
            emotion: currentEmotion || 'neutral',
            behaviorPatterns,
            userProfile,
            userEmail,
            userId,
            stressLevel,
            taskLoad,
            documentContext,
          }
        : {
            message: finalMessage,
            emotion: currentEmotion || 'neutral',
            stressLevel,
            taskLoad,
            documentContext,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Assistant request failed');
      }

      const data = await response.json();
      let assistantMessage = data.response || data.message || 'Sorry, I could not generate a response.';

      if (shouldUseStructuredAssistant) {
        const modalMessage = data.suggestion || data.message;
        if (modalMessage && onSuggestionUpdate) {
          onSuggestionUpdate({
            ...data,
            message: modalMessage,
          });
        }

        const actionResult = await executeAssistantAction(data.action);
        if (actionResult) {
          assistantMessage = `${assistantMessage}\n\n${actionResult}`;
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Text-to-Speech if enabled
      if (speechEnabled && window.speechSynthesis) {
        speak(assistantMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (action) => {
    try {
      console.log('[DEBUG] Handling document action:', action);
      
      const response = await fetch('/api/document/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      console.log('[DEBUG] AI result:', result);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.message 
      }]);

      // Handle different action outputs
      if (action === 'convert_txt' && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${documentContext.name}.txt`;
        link.click();
      }

      if (action === 'convert_pdf' && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${documentContext.name}.pdf`;
        link.click();
      }

      if (action === 'extract_tasks' && result.tasks && onAddTask) {
        // Add tasks to dashboard
        for (const task of result.tasks) {
          await onAddTask(task.title, task.priority);
        }
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Added ${result.tasks.length} tasks to your dashboard.` 
        }]);
      }
    } catch (error) {
      console.error('[ERROR] Document action error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I couldn't process that action. Error: ${error.message}` 
      }]);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessingDocument(true);
    setDocumentContext({ name: file.name, type: file.type });

    try {
      const { extractTextFromDocument } = await import('@/services/documentService');
      const text = await extractTextFromDocument(file);
      setExtractedText(text);
      
      // Add system message about document
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `Document uploaded: ${file.name}\n\nExtracted content:\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}` 
      }]);

      // Show preview option
      setShowDocumentPreview(true);

      // Ask user what to do
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I\'ve analyzed your document. What would you like to do with it?\n\nOptions:\n- Summarize\n- Extract tasks\n- Convert to TXT\n- Convert to PDF\n- Ask questions about it\n\nType "preview" to see the full extracted text.' 
      }]);
    } catch (error) {
      console.error('Document processing error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I couldn\'t process that document. Please try a different file.' 
      }]);
    } finally {
      setProcessingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20">
            <Sparkles size={20} className="text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">E.C.H.O AI</h3>
            <p className="text-xs text-gray-400">Emotion-aware assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded-lg transition-colors ${
              speechEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/5 text-gray-400'
            }`}
            title={speechEnabled ? 'Disable speech' : 'Enable speech'}
          >
            {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles size={48} className="text-teal-400 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Hi, I'm E.C.H.O</p>
            <p className="text-sm">Your emotionally aware AI assistant</p>
            <p className="text-xs mt-4 text-gray-500">I adapt to your mood and help with productivity</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] p-3 sm:p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border border-teal-400/30'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <p className="text-sm sm:text-base text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 p-3 sm:p-4 rounded-2xl flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-gray-400">Thinking...</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processingDocument || loading}
            className="p-3 rounded-xl bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload Document"
          >
            {processingDocument ? (
              <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={20} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {onOpenVoiceMode && (
            <button
              type="button"
              onClick={onOpenVoiceMode}
              className="p-3 rounded-xl bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
              title="Voice Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/50 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        {documentContext && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <FileText size={14} className="text-teal-400" />
            <span className="text-xs text-teal-300">{documentContext.name}</span>
            <button
              type="button"
              onClick={() => setDocumentContext(null)}
              className="ml-auto text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default memo(ChatUI);
