import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, Mic, Square, Volume2, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

interface ChatMessage {
  id: string;
  type: 'user' | 'therapist';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

const Therapy: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscription = (liveTranscription + finalTranscript + interimTranscript).trim();
        setLiveTranscription(currentTranscription);
        setInputText(currentTranscription);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
      };

      setSpeechRecognition(recognition);
    }
  }, [liveTranscription]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      type: 'therapist',
      content: "Hello! Welcome to Talk2Me. I'm here to provide a safe, supportive space for you to share your thoughts and feelings. I've reviewed your recent journal entries to better understand your journey. How are you feeling today, and what would you like to talk about?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        if (speechRecognition) {
          speechRecognition.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscription('');
      
      // Start speech recognition
      if (speechRecognition) {
        try {
          speechRecognition.start();
        } catch (error) {
          console.warn('Speech recognition failed to start:', error);
        }
      }
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started! Speak freely...');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      if (speechRecognition) {
        speechRecognition.stop();
      }
      
      toast.success('Recording stopped!');
    }
  };

  const sendMessage = async (content: string, isAudio = false) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isAudio
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/therapy/chat', {
        message: content.trim(),
        message_type: isAudio ? 'audio' : 'text'
      });

      const therapistMessage: ChatMessage = {
        id: 'therapist-' + Date.now(),
        type: 'therapist',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, therapistMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from Talk2Me. Please try again.');
      
                  const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        type: 'therapist',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment. Remember, I'm here to listen and support you through Talk2Me.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = () => {
    sendMessage(inputText);
    setInputText('');
  };

  const handleAudioSubmit = () => {
    if (liveTranscription.trim()) {
      sendMessage(liveTranscription, true);
      setInputText('');
      setLiveTranscription('');
      setAudioBlob(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <Heart className="mr-3 text-pink-500" size={32} />
          <h1 className="text-4xl font-bold text-night-text">Talk2Me</h1>
        </div>
        <p className="text-lg text-night-text-secondary">
          Your AI companion for meaningful conversations and personal support
        </p>
      </motion.div>

      {/* Chat Messages */}
      <Card className="h-96 overflow-y-auto mb-6">
        <CardContent className="p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-night-accent text-white' 
                    : 'bg-pink-500 text-white'
                }`}>
                  {message.type === 'user' ? <User size={16} /> : <Heart size={16} />}
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-night-accent text-white'
                    : 'bg-night-surface border border-night-border text-night-text'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.isAudio && (
                    <div className="flex items-center mt-2 text-xs opacity-75">
                      <Volume2 size={12} className="mr-1" />
                      Voice message
                    </div>
                  )}
                  <p className="text-xs mt-2 opacity-75">
                    {message.timestamp.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center">
                  <Heart size={16} />
                </div>
                <div className="bg-night-surface border border-night-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm text-night-text-secondary ml-2">Talk2Me is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          {/* Audio Recording */}
          {isRecording && (
            <div className="mb-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-pink-700 dark:text-pink-300">Recording...</span>
                </div>
                <span className="text-sm text-pink-600 dark:text-pink-400">{formatTime(recordingTime)}</span>
              </div>
              {liveTranscription && (
                <div className="text-sm text-pink-800 dark:text-pink-200 bg-white/50 dark:bg-black/20 p-2 rounded">
                  <strong>Live transcription:</strong> {liveTranscription}
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          <div className="flex gap-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? "Speaking... (live transcription active)" : "Share your thoughts, feelings, or ask for support..."}
              className="flex-1 p-3 bg-night-surface border border-night-border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              disabled={isLoading || isRecording}
            />
            <div className="flex flex-col gap-2">
              {!isRecording ? (
                <>
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    size="sm"
                    className="w-12 h-12 p-0 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                  >
                    <Mic size={18} />
                  </Button>
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!inputText.trim() || isLoading}
                    size="sm"
                    className="w-12 h-12 p-0 bg-pink-500 hover:bg-pink-600"
                  >
                    <Send size={18} />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    size="sm"
                    className="w-12 h-12 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Square size={18} />
                  </Button>
                  <Button
                    onClick={handleAudioSubmit}
                    disabled={!liveTranscription.trim()}
                    size="sm"
                    className="w-12 h-12 p-0 bg-pink-500 hover:bg-pink-600"
                  >
                    <Send size={18} />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-night-text-secondary text-center">
            Press Enter to send • Hold Mic to record voice messages • Shift+Enter for new line
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Therapy;