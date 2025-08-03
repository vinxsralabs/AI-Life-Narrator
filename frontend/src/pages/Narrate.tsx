import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mic, Sparkles, Play, Loader, Volume2, VolumeX, Download, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatDateTime } from '../utils/timezone';

interface TimelineEntry {
  date: string;
  entry?: { id: number; text_content: string; ai_generated_story: string };
  audio_files: any[];
  images: any[];
}

const Narrate: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [showNarrative, setShowNarrative] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingAudioFor, setGeneratingAudioFor] = useState<number | null>(null);
  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);
  const [queryText, setQueryText] = useState('');
  const [queryResponse, setQueryResponse] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState<Array<{
    id: string, 
    question: string, 
    answer: string, 
    timestamp: Date,
    audioUrl?: string,
    audioBlob?: Blob,
    imageUrl?: string
  }>>([]);
  const [displayedSearches, setDisplayedSearches] = useState<number>(3);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load query history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('memsearch_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setQueryHistory(historyWithDates);
      } catch (error) {
        console.error('Failed to load memory search history:', error);
      }
    }
  }, []);

  // Save query history to localStorage whenever it changes
  useEffect(() => {
    if (queryHistory.length > 0) {
      localStorage.setItem('memsearch_history', JSON.stringify(queryHistory));
    } else {
      // Remove the key if no history exists
      localStorage.removeItem('memsearch_history');
    }
  }, [queryHistory]);

  const loadMoreSearches = () => {
    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedSearches(prev => prev + 3);
      setLoadingMore(false);
    }, 500);
  };

  const clearSearchHistory = () => {
    if (window.confirm('Are you sure you want to clear all your memory search history? This action cannot be undone.')) {
      setQueryHistory([]);
      setDisplayedSearches(3);
      localStorage.removeItem('memsearch_history');
      toast.success('Search history cleared');
    }
  };

  const askQuestion = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsQuerying(true);
    const toastId = toast.loading('Searching your memories...');

    try {
      // Get ALL user's entries for context (no date limit)
      const response = await axios.get('/api/timeline', {
        params: {
          all_stories: true // Get all stories, not just recent ones
        }
      });

      const timelineData = response.data.entries;
      
      if (timelineData.length === 0) {
        toast.error('No memories found. Please create some journal entries first.', { id: toastId });
        return;
      }

      // Prepare the data for query
      const entriesData = timelineData
        .filter((day: any) => day.entry)
        .map((day: any) => ({
          date: day.date,
          text_content: day.entry?.text_content || '',
          ai_generated_story: day.entry?.ai_generated_story || ''
        }));

      const queryResponse = await axios.post('/api/narrate/query', {
        query: queryText.trim(),
        entries: entriesData,
        start_date: 'all', // Indicate we want all stories
        end_date: 'all'
      });

      const answer = queryResponse.data.response;
      
      // Add to query history
      const newQuery = {
        id: Date.now().toString(),
        question: queryText.trim(),
        answer: answer,
        timestamp: new Date()
      };
      
      setQueryHistory(prev => [newQuery, ...prev]);
      setQueryText('');
      toast.success('Memory search complete!', { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to search your memories';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsQuerying(false);
    }
  };

  const generateAudioForQA = async (id: string, answer: string) => {
    setGeneratingAudioFor(parseInt(id));
    const toastId = toast.loading('Generating audio...');

    try {
      const response = await axios.post('/api/narrate/audio', {
        text: answer
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Update the query history with audio URL
      setQueryHistory(prev => prev.map(item => 
        item.id === id 
          ? { ...item, audioUrl: url, audioBlob: blob }
          : item
      ));
      
      // Save audio URL to database
      try {
        await axios.put(`/api/narrate/query/${id}/audio`, null, {
          params: { audio_url: url }
        });
      } catch (error) {
        console.error('Failed to save audio URL to database:', error);
      }
      
      toast.success('Audio generated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Audio generation error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate audio';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setGeneratingAudioFor(null);
    }
  };

  const generateImageForQA = async (id: string, answer: string) => {
    setGeneratingImageFor(parseInt(id));
    const toastId = toast.loading('Generating image...');

    try {
      const response = await axios.post('/api/narrate/image', {
        text: answer
      });

      // Update the query history with image URL
      setQueryHistory(prev => prev.map(item => 
        item.id === id 
          ? { ...item, imageUrl: response.data.image_url }
          : item
      ));
      
      // Save image URL to database
      try {
        await axios.put(`/api/narrate/query/${id}/image`, null, {
          params: { image_url: response.data.image_url }
        });
      } catch (error) {
        console.error('Failed to save image URL to database:', error);
      }
      
      toast.success('Image generated successfully!', { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to generate image';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const playQAAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const downloadQAAudio = (id: string, question: string) => {
    const item = queryHistory.find(q => q.id === id);
    if (item?.audioBlob) {
      const url = URL.createObjectURL(item.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-${question.replace(/\s+/g, '-').toLowerCase()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadQAImage = (imageUrl: string, question: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `question-${question.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Cleanup audio URL and stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Stop all audio and TTS when component unmounts
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      setIsPlaying(false);
    };
  }, [audioUrl]);

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
      <motion.div className="text-center mb-8" variants={itemVariants}>
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
          <Mic className="mr-3 text-night-accent" />
          MemSearch
        </h1>
        <p className="text-lg text-night-text-secondary">
          Search and analyze your memories with natural language queries
        </p>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-8" variants={itemVariants}>
        {/* Natural Language Query - Full Width */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2" />
              Search Your Memories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Question</label>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask anything about your memories... e.g., 'What happened last week?' or 'Narrate my last week happenings' or 'What patterns do you see in my routine?' or 'How have I grown over time?'"
                className="w-full h-32 p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent resize-none"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isQuerying) {
                    e.preventDefault();
                    askQuestion();
                  }
                }}
              />
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={askQuestion}
                loading={isQuerying}
                className="w-full md:w-auto"
              >
                <Sparkles className="mr-2" />
                Search Memories
              </Button>
            </div>
            
            <div className="text-xs text-night-text-secondary text-center">
              Press Enter to search • Shift+Enter for new line
            </div>
          </CardContent>
        </Card>

        {/* Query History - Full Width */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2" />
                Your Memory Searches
              </div>
              {queryHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-night-text-secondary">
                    Showing {Math.min(displayedSearches, queryHistory.length)} of {queryHistory.length} searches
                  </span>
                  <Button
                    onClick={clearSearchHistory}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <VolumeX className="mr-1" size={16} />
                    Clear History
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queryHistory.length > 0 ? (
              <div className="space-y-6">
                {queryHistory.slice(0, displayedSearches).map((item) => (
                  <motion.div 
                    key={item.id} 
                    className="border border-night-border rounded-lg p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-night-accent">Q:</span>
                          <span className="text-sm text-night-text">{item.question}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Audio and Image Generation Options */}
                          <Button 
                            onClick={() => generateAudioForQA(item.id, item.answer)}
                            loading={generatingAudioFor === parseInt(item.id)}
                            variant="outline"
                            size="sm"
                            className="p-2"
                            title="Generate Audio"
                          >
                            <Volume2 size={16} />
                          </Button>
                          <Button 
                            onClick={() => generateImageForQA(item.id, item.answer)}
                            loading={generatingImageFor === parseInt(item.id)}
                            variant="outline"
                            size="sm"
                            className="p-2"
                            title="Generate Image"
                          >
                            <ImageIcon size={16} />
                          </Button>
                          
                          {/* Audio Play/Download */}
                          {item.audioUrl && (
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => item.audioUrl && playQAAudio(item.audioUrl)}
                                variant="outline"
                                size="sm"
                                className="p-2"
                                title="Play Audio"
                              >
                                <Play size={16} />
                              </Button>
                              <Button 
                                onClick={() => downloadQAAudio(item.id, item.question)}
                                variant="outline"
                                size="sm"
                                className="p-2"
                                title="Download Audio"
                              >
                                <Download size={16} />
                              </Button>
                            </div>
                          )}
                          
                          {/* Image Download */}
                          {item.imageUrl && (
                            <Button 
                              onClick={() => item.imageUrl && downloadQAImage(item.imageUrl, item.question)}
                              variant="outline"
                              size="sm"
                              className="p-2"
                              title="Download Image"
                            >
                              <Download size={16} />
                            </Button>
                          )}
                          
                          <span className="text-xs text-night-text-secondary">
                            {item.timestamp.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-night-accent mt-0.5">A:</span>
                        <p className="text-sm text-night-text bg-night-surface p-3 rounded flex-1 whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                    
                    {/* Generated Image Display */}
                    {item.imageUrl && (
                      <div className="mt-4">
                        <img 
                          src={item.imageUrl} 
                          alt="Generated illustration" 
                          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
                {queryHistory.length > displayedSearches && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={loadMoreSearches}
                      loading={loadingMore}
                      className="w-full md:w-auto"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Searches'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="mx-auto mb-4 text-night-text-secondary" size={48} />
                <p className="text-night-text-secondary">
                  Search your first memory to see your search history here!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Narrate; 