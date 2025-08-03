import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mic, Camera, FileText, Sparkles, Check, Upload as UploadIcon, X, Play, Square, RotateCcw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [textContent, setTextContent] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState('');
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prev => [...prev, ...acceptedFiles.slice(0, 5 - prev.length)]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*':[]},
    maxFiles: 5,
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Initialize speech recognition
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Always reconstruct the full text from scratch
        const fullText = finalTranscript + ' ' + interimTranscript;
        setTextContent(fullText);
        setAccumulatedText(finalTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        // Don't show error toast for common issues like no-speech
        if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
          toast.error('Speech recognition error. Live transcription may not work properly.');
        }
      };

      recognition.onend = () => {
        // No need to clean text here - let user edit naturally
        setIsRecognitionActive(false);
      };

      setSpeechRecognition(recognition);
    }
  }, []);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
        
        // Stop speech recognition when recording stops
        if (speechRecognition) {
          speechRecognition.stop();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscription('');
      setTextContent(''); // Clear text content when starting new recording
      setAccumulatedText(''); // Clear accumulated text when starting new recording
      
      // Start speech recognition for live transcription
      if (speechRecognition && !isRecognitionActive) {
        try {
          setIsRecognitionActive(true);
          speechRecognition.start();
        } catch (error) {
          console.warn('Speech recognition failed to start:', error);
          setIsRecognitionActive(false);
        }
      }
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started! Speak clearly for live transcription.');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else {
        toast.error('Failed to start recording. Please check microphone permissions.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      // Stop speech recognition
      if (speechRecognition && isRecognitionActive) {
        speechRecognition.stop();
        setIsRecognitionActive(false);
      }
      
      toast.success('Recording stopped!');
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setLiveTranscription('');
    setTextContent(''); // Clear text content when resetting
    setAccumulatedText(''); // Clear accumulated text when resetting
    setEntryId(null);
    
    // Stop speech recognition if active
    if (speechRecognition && isRecognitionActive) {
      speechRecognition.stop();
      setIsRecognitionActive(false);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSubmit = async () => {
    const finalTextContent = cleanText(textContent);
    if (!finalTextContent && images.length === 0 && !audioBlob) {
      toast.error("Please add some content before creating an entry.");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Creating your new entry...');

    try {
      let finalEntryId = entryId;

      // If we have audio but no entry yet, upload audio first
      if (audioBlob && !entryId) {
        const audioFormData = new FormData();
        audioFormData.append('file', audioBlob, 'recording.webm');
        
        const audioResponse = await axios.post('/api/upload/audio', audioFormData, {
          params: {
            story_style: 'story',
            create_entry: true
          }
        });
        
        // Update the entry with the final text content
        if (audioResponse.data.file_id) {
          // Get the entry ID from the audio file
          const audioFileResponse = await axios.get(`/api/audio/${audioResponse.data.file_id}`);
          if (audioFileResponse.data.entry_id) {
            finalEntryId = audioFileResponse.data.entry_id;
            // Update the entry text
            await axios.put(`/api/entries/${finalEntryId}/text`, null, { params: { text_content: finalTextContent } });
          }
        }
      } else if (entryId) {
        // Update existing entry text
        await axios.put(`/api/entries/${entryId}/text`, null, { params: { text_content: finalTextContent } });
        finalEntryId = entryId;
      } else {
        // Create new entry without audio
        const entryResponse = await axios.post('/api/entries', {
          text_content: finalTextContent,
          story_style: 'story',
        });
        finalEntryId = entryResponse.data.id;
      }

      // Upload images if any
      if (images.length > 0 && finalEntryId) {
        const imageFormData = new FormData();
        images.forEach(image => imageFormData.append('files', image));
        await axios.post(`/api/upload/image?entry_id=${finalEntryId}`, imageFormData);
      }

      // Upload audio if we haven't already
      if (audioBlob && !entryId && finalEntryId) {
        const audioFormData = new FormData();
        audioFormData.append('file', audioBlob, 'recording.webm');
        await axios.post(`/api/upload/audio?entry_id=${finalEntryId}`, audioFormData);
      }
      
      toast.success('Entry created! Taking you to the story...', { id: toastId });
      navigate(`/story/${finalEntryId}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create entry. Please try again.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const MAX_CHARS = 500;

  // Function to clean up text and remove extra spaces
  const cleanText = (text: string) => {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+$/g, '') // Remove trailing spaces
      .replace(/^\s+/g, '') // Remove leading spaces
      .trim();
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Create Your Story</h1>
        <p className="text-lg text-night-text-secondary">Combine your thoughts, voice, and snapshots into a beautiful story.</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <Card variant="elevated">
            <CardContent>
              <label htmlFor="text-content" className="flex items-center text-lg font-medium mb-2">
                <FileText className="inline-block mr-2" /> Your Thoughts
                {isRecording && liveTranscription && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full animate-pulse">
                    Live Transcription Active
                  </span>
                )}
              </label>
              <div className="relative">
                <textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full h-48 p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent transition-shadow"
                  placeholder={isRecording ? "Speaking... (your words will appear here automatically)" : "What happened today? How are you feeling? Start recording for live transcription!"}
                  maxLength={MAX_CHARS}
                />
                <p className="absolute bottom-2 right-2 text-xs text-night-text-secondary">
                  {textContent.length} / {MAX_CHARS}
                </p>
              </div>
              
              {/* Add Photos and Record Audio Icons */}
              <div className="mt-4 flex items-center justify-center gap-8">
                {/* Add Photos */}
                <div {...getRootProps()} className="flex items-center gap-2 text-night-accent hover:text-night-accent/80 cursor-pointer transition-colors">
                  <input {...getInputProps()} />
                  <Camera size={20} />
                  <span className="text-sm font-medium">Add Photos</span>
                </div>
                
                {/* Record Audio */}
                <div className="flex items-center gap-4">
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-night-accent hover:text-night-accent/80"
                    >
                      <Mic size={20} />
                      <span className="text-sm font-medium">Record Audio</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <Button 
                        onClick={stopRecording}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-red-500 hover:text-red-600"
                      >
                        <Square size={20} />
                        <span className="text-sm font-medium">Stop Recording ({formatTime(recordingTime)})</span>
                      </Button>
                    </div>
                  )}
                  
                  {audioBlob && (
                    <div className="flex items-center gap-2">
                      {!isPlaying ? (
                        <Button 
                          onClick={playRecording}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-green-500 hover:text-green-600"
                        >
                          <Play size={16} />
                          <span className="text-xs">Play</span>
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopPlaying}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-green-500 hover:text-green-600"
                        >
                          <Square size={16} />
                          <span className="text-xs">Stop</span>
                        </Button>
                      )}
                      <Button 
                        onClick={resetRecording}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-600"
                      >
                        <RotateCcw size={16} />
                        <span className="text-xs">Re-record</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {images.map((file, i) => (
                    <motion.div key={i} className="relative group" layout>
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-24 object-cover rounded-md" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} className="text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>




        </div>

        
      </div>
      
      <div className="mt-8 text-center">
        <Button onClick={handleSubmit} loading={isSubmitting} size="lg" className="w-full md:w-auto">
          <Check className="mr-2" /> Post
        </Button>
      </div>
    </motion.div>
  );
};

export default Upload; 