import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Star, FileText, BarChart2, Trash2, Mic, Camera, Check, Play, Square, RotateCcw, X, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/timezone';

interface Entry {
  id: number;
  date: string;
  text_content: string;
  ai_generated_story: string;
  story_style: string;
}

const StatCard = ({ icon, label, value, isLoading }: { icon: React.ReactNode, label: string, value: string | number, isLoading: boolean }) => (
  <Card variant="glass" padding="md">
    <CardContent className="flex items-center justify-between">
      <div>
        <p className="text-sm text-night-text-secondary mb-1">{label}</p>
        {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{value}</p>}
      </div>
      <div className="bg-night-accent/20 p-3 rounded-full">
        {icon}
      </div>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({ totalEntries: 0, storiesGenerated: 0, weeklyStreak: 0, memSearchQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    entryId: number | null;
    entryDate: string;
  }>({
    isOpen: false,
    entryId: null,
    entryDate: ''
  });
  const [deleting, setDeleting] = useState(false);

  // Your thoughts functionality states
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

  const MAX_CHARS = 500;

  // Dropzone for images
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

  // Function to clean up text and remove extra spaces
  const cleanText = (text: string) => {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+$/g, '') // Remove trailing spaces
      .replace(/^\s+/g, '') // Remove leading spaces
      .trim();
  };

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
      
      // Reset form
      setTextContent('');
      setAudioBlob(null);
      setAudioUrl(null);
      setImages([]);
      setEntryId(null);
      setRecordingTime(0);
      setIsPlaying(false);
      setLiveTranscription('');
      setAccumulatedText('');
      
      // Refresh dashboard data
      fetchData();
      
      navigate(`/story/${finalEntryId}`);

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create entry. Please try again.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get MemSearch questions count from localStorage
      const savedHistory = localStorage.getItem('memsearch_history');
      let memSearchQuestions = 0;
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          memSearchQuestions = parsedHistory.length;
        } catch (error) {
          console.error('Failed to parse MemSearch history:', error);
        }
      }

      const [entriesRes, statsRes] = await Promise.all([
        axios.get('/api/entries?limit=3'),
        axios.get('/api/dashboard/stats')
      ]);
      
      setRecentEntries(entriesRes.data);
      setStats({ 
        totalEntries: statsRes.data.total_entries, 
        storiesGenerated: statsRes.data.stories_generated,
        weeklyStreak: statsRes.data.weekly_streak,
        memSearchQuestions: memSearchQuestions
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Refresh MemSearch questions count when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedHistory = localStorage.getItem('memsearch_history');
      let memSearchQuestions = 0;
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          memSearchQuestions = parsedHistory.length;
        } catch (error) {
          console.error('Failed to parse MemSearch history:', error);
        }
      }
      setStats(prev => ({ ...prev, memSearchQuestions }));
    };

    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on focus (when user returns to this tab)
    const handleFocus = () => {
      handleStorageChange();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleDeleteClick = (entryId: number, date: string) => {
    setDeleteModal({
      isOpen: true,
      entryId,
      entryDate: date
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.entryId) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/entries/${deleteModal.entryId}`);
      
      // Remove the entry from recent entries
      setRecentEntries(prev => 
        prev.filter(entry => entry.id !== deleteModal.entryId)
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEntries: Math.max(0, prev.totalEntries - 1)
      }));
      
      toast.success('Entry deleted successfully');
      setDeleteModal({ isOpen: false, entryId: null, entryDate: '' });
    } catch (error) {
      toast.error('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, entryId: null, entryDate: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 pt-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 
        className="text-4xl font-bold mb-2"
        variants={itemVariants}
      >
        Welcome Home, {user?.username}!
      </motion.h1>
      <motion.p className="text-lg text-night-text-secondary mb-8" variants={itemVariants}>
        Ready to chronicle your day?
      </motion.p>

      {/* Your Thoughts and Stats Section */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
        {/* Your Thoughts Section - Takes 2 columns */}
        <div className="lg:col-span-2">
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
                  className="w-full h-32 p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent transition-shadow"
                  placeholder={isRecording ? "Speaking... (your words will appear here automatically)" : "What happened today? How are you feeling? Start recording for live transcription!"}
                  maxLength={MAX_CHARS}
                />
                <p className="absolute bottom-2 right-2 text-xs text-night-text-secondary">
                  {textContent.length} / {MAX_CHARS}
                </p>
              </div>
              
              {/* Add Photos and Record Audio Icons */}
              <div className="mt-4 flex items-center justify-center gap-6">
                {/* Add Photos */}
                <div {...getRootProps()} className="flex items-center gap-2 text-night-accent hover:text-night-accent/80 cursor-pointer transition-colors">
                  <input {...getInputProps()} />
                  <Camera size={18} />
                  <span className="text-sm font-medium">Add Photos</span>
                </div>
                
                {/* Record Audio */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-night-accent hover:text-night-accent/80"
                    >
                      <Mic size={18} />
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
                        <Square size={18} />
                        <span className="text-sm font-medium">Stop ({formatTime(recordingTime)})</span>
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
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {images.map((file, i) => (
                    <motion.div key={i} className="relative group" layout>
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-20 object-cover rounded-md" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} className="text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-4 text-center">
                <Button onClick={handleSubmit} loading={isSubmitting} size="md" className="w-full md:w-auto">
                  <Check className="mr-2" /> Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section - Takes 1 column */}
        <div className="space-y-4">
          <StatCard icon={<FileText size={24} />} label="Total Entries" value={stats.totalEntries} isLoading={loading} />
          <StatCard icon={<Search size={24} />} label="MemSearch Questions" value={stats.memSearchQuestions} isLoading={loading} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
        {/* Recent Entries */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Entries</h2>
          </div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-night-surface rounded-lg">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : recentEntries.length > 0 ? (
          <motion.div className="space-y-3" variants={containerVariants}>
            {recentEntries.map((entry) => (
              <motion.div key={entry.id} variants={itemVariants}>
                <div className="flex items-start justify-between p-4 bg-night-surface rounded-lg hover:bg-night-surface/80 transition-colors">
                  <Link to={`/story/${entry.id}`} className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-night-accent">
                        {entry.date ? formatDateTime(entry.date, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: undefined
                        }) : 'No date'}
                      </span>
                      {entry.ai_generated_story && <Star size={14} className="text-yellow-400" />}
                    </div>
                    <p className="text-night-text line-clamp-2">
                      {entry.text_content || "View generated story..."}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(entry.id, entry.date)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-2 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="text-center py-16" variant="glass">
            <CardContent>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                <BookOpen size={48} className="mx-auto text-night-accent mb-4" />
              </motion.div>
              <h3 className="text-2xl font-semibold mb-2">Your Journal Awaits</h3>
              <p className="text-night-text-secondary mb-6">Every great story starts with a single word. Use the form above to create your first entry!</p>
            </CardContent>
          </Card>
        )}
        </div>
      </motion.div>
      
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Entry"
        message={`Are you sure you want to delete this entry from ${deleteModal.entryDate}? This action cannot be undone and will also delete any associated audio recordings and images.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        type="danger"
      />
    </motion.div>
  );
};

export default Dashboard; 