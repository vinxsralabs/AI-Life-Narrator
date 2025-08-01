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
  const [storyStyle, setStoryStyle] = useState('story');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  
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
        
        // Update the text content in real-time
        if (currentTranscription) {
          setTextContent(currentTranscription);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        // Don't show error toast for common issues like no-speech
        if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
          toast.error('Speech recognition error. Live transcription may not work properly.');
        }
      };

      setSpeechRecognition(recognition);
    }
  }, [liveTranscription]);

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
      
      // Start speech recognition for live transcription
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
      if (speechRecognition) {
        speechRecognition.stop();
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
    setTranscription('');
    setShowTranscription(false);
    setLiveTranscription('');
    setEntryId(null);
    
    // Stop speech recognition if active
    if (speechRecognition) {
      speechRecognition.stop();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAudioUpload = async () => {
    if (!audioBlob) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('Transcribing your audio...');

    try {
      const audioFormData = new FormData();
      audioFormData.append('file', audioBlob, 'recording.webm');
      
      const response = await axios.post('/api/upload/audio', audioFormData, {
        params: {
          story_style: storyStyle
        }
      });

      setTranscription(response.data.transcription || '');
      setShowTranscription(true);
      setTextContent(response.data.transcription || '');
      
      // Extract entry ID from the response if available
      if (response.data.file_id) {
        // Get the entry ID from the audio file
        const audioResponse = await axios.get(`/api/audio/${response.data.file_id}`);
        if (audioResponse.data.entry_id) {
          setEntryId(audioResponse.data.entry_id);
        }
      }

      toast.success('Audio transcribed successfully!', { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to transcribe audio. Please try again.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
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
    if (!textContent && images.length === 0 && !audioBlob) {
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
            story_style: storyStyle,
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
            await axios.put(`/api/entries/${finalEntryId}/text`, null, { params: { text_content: textContent } });
          }
        }
      } else if (entryId) {
        // Update existing entry text
        await axios.put(`/api/entries/${entryId}/text`, null, { params: { text_content: textContent } });
        finalEntryId = entryId;
      } else {
        // Create new entry without audio
        const entryResponse = await axios.post('/api/entries', {
          text_content: textContent,
          story_style: storyStyle,
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
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
                  placeholder={isRecording ? "Speaking... (live transcription active)" : "What happened today? How are you feeling? Start recording for live transcription!"}
                  maxLength={MAX_CHARS}
                />
                <p className="absolute bottom-2 right-2 text-xs text-night-text-secondary">
                  {textContent.length} / {MAX_CHARS}
                </p>
              </div>
                         </CardContent>
           </Card>

          {showTranscription && (
            <Card variant="elevated">
              <CardContent>
                <h2 className="text-lg font-medium mb-2 flex items-center">
                  <FileText className="inline-block mr-2" /> Transcription
                </h2>
                <div className="bg-night-surface p-3 rounded-md">
                  <p className="text-night-text-secondary text-sm mb-2">Audio transcription:</p>
                  <p className="text-night-text">{transcription}</p>
                </div>
                <p className="text-xs text-night-text-secondary mt-2">
                  You can edit this text in the "Your Thoughts" section above.
                </p>
              </CardContent>
            </Card>
          )}

          <Card variant="elevated">
            <CardContent>
              <label htmlFor="story-style" className="flex items-center text-lg font-medium mb-2">
                <Sparkles className="inline-block mr-2" /> AI Narrative Style
              </label>
              <select
                id="story-style"
                value={storyStyle}
                onChange={(e) => setStoryStyle(e.target.value)}
                className="w-full p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent"
              >
                <option value="story">Classic Narrative</option>
                <option value="comic">Comic Book</option>
                <option value="poetic">Poetic Verse</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           <Card variant="elevated">
             <CardContent>
                <h2 className="text-lg font-medium mb-2 flex items-center"><Mic className="inline-block mr-2" /> Record Audio</h2>
                
                {!audioBlob ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-24 bg-night-surface rounded-md">
                      {isRecording ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                            <span className="text-red-500 font-medium">Recording...</span>
                          </div>
                          <p className="text-sm text-night-text-secondary">{formatTime(recordingTime)}</p>
                        </div>
                      ) : (
                        <p className="text-night-text-secondary">Click the microphone to start recording</p>
                      )}
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      {!isRecording ? (
                        <Button 
                          onClick={startRecording}
                          variant="outline"
                          className="flex items-center"
                        >
                          <Mic size={16} className="mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopRecording}
                          variant="outline"
                          className="flex items-center bg-red-500 hover:bg-red-600"
                        >
                          <Square size={16} className="mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-24 bg-night-surface rounded-md">
                      <audio 
                        ref={audioRef}
                        src={audioUrl || undefined}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full"
                      />
                      <div className="text-center">
                        <p className="text-sm text-night-text-secondary mb-2">Recording saved!</p>
                        <p className="text-xs text-night-text-secondary">Duration: {formatTime(recordingTime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      {!isPlaying ? (
                        <Button 
                          onClick={playRecording}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <Play size={16} className="mr-2" />
                          Play
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopPlaying}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <Square size={16} className="mr-2" />
                          Stop
                        </Button>
                      )}
                      <Button 
                        onClick={handleAudioUpload}
                        loading={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <FileText size={16} className="mr-2" />
                        Transcribe
                      </Button>
                      <Button 
                        onClick={resetRecording}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <RotateCcw size={16} className="mr-2" />
                        Re-record
                      </Button>
                    </div>
                  </div>
                )}
             </CardContent>
           </Card>
          <Card variant="elevated">
            <CardContent>
              <h2 className="text-lg font-medium mb-2 flex items-center"><Camera className="inline-block mr-2" /> Add Photos</h2>
              <div {...getRootProps()} className={`border-2 border-dashed border-night-border p-8 text-center rounded-md cursor-pointer transition-colors ${isDragActive ? 'bg-night-accent/20 border-night-accent' : ''}`}>
                <input {...getInputProps()} />
                <UploadIcon className="mx-auto mb-2 text-night-text-secondary" />
                <p className="text-night-text-secondary">{isDragActive ? "Drop the files here..." : "Drag 'n' drop up to 5 images, or click"}</p>
              </div>
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