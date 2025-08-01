import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mic, Sparkles, Play, Loader, Volume2, VolumeX, Download, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface TimelineEntry {
  date: string;
  entry?: { id: number; text_content: string; ai_generated_story: string };
  audio_files: any[];
  images: any[];
}

const Narrate: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
  const [narrativeHistory, setNarrativeHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySkip, setHistorySkip] = useState(0);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [expandedNarratives, setExpandedNarratives] = useState<Set<number>>(new Set());
  const [generatingAudioFor, setGeneratingAudioFor] = useState<number | null>(null);
  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);

  // Set default date range (last 7 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch narrative history on component mount
  useEffect(() => {
    fetchNarrativeHistory();
  }, []);

  const fetchNarrativeHistory = async (skip: number = 0) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get('/api/narrate/history', {
        params: { skip, limit: 3 }
      });
      
      if (skip === 0) {
        setNarrativeHistory(response.data.narratives);
      } else {
        setNarrativeHistory(prev => [...prev, ...response.data.narratives]);
      }
      setTotalHistoryCount(response.data.total_count);
      setHistorySkip(skip + response.data.narratives.length);
    } catch (error) {
      toast.error('Failed to load narrative history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMoreHistory = () => {
    fetchNarrativeHistory(historySkip);
  };

  const toggleNarrativeExpansion = (narrativeId: number) => {
    setExpandedNarratives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(narrativeId)) {
        newSet.delete(narrativeId);
      } else {
        newSet.add(narrativeId);
      }
      return newSet;
    });
  };

  const generateAudioForNarrative = async (narrativeId: number, narrativeText: string) => {
    setGeneratingAudioFor(narrativeId);
    const toastId = toast.loading('Generating audio...');

    try {
      const response = await axios.post('/api/narrate/audio', {
        text: narrativeText
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Update the narrative in history with audio URL
      setNarrativeHistory(prev => prev.map(narrative => 
        narrative.id === narrativeId 
          ? { ...narrative, audio_url: url, audio_blob: blob }
          : narrative
      ));
      
      // Save audio URL to database
      try {
        await axios.put(`/api/narrate/${narrativeId}/audio`, null, {
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

  const generateImageForNarrative = async (narrativeId: number, narrativeText: string) => {
    setGeneratingImageFor(narrativeId);
    const toastId = toast.loading('Generating image...');

    try {
      const response = await axios.post('/api/narrate/image', {
        text: narrativeText
      });

      // Update the narrative in history with image URL
      setNarrativeHistory(prev => prev.map(narrative => 
        narrative.id === narrativeId 
          ? { ...narrative, image_url: response.data.image_url }
          : narrative
      ));
      
      // Save image URL to database
      try {
        await axios.put(`/api/narrate/${narrativeId}/image`, null, {
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

  const playNarrativeAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const downloadNarrativeAudio = (narrativeId: number, startDate: string, endDate: string) => {
    const narrative = narrativeHistory.find(n => n.id === narrativeId);
    if (narrative?.audio_blob) {
      const url = URL.createObjectURL(narrative.audio_blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `narrative-${startDate}-to-${endDate}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadNarrativeImage = (imageUrl: string, startDate: string, endDate: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `narrative-${startDate}-to-${endDate}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fetchTimeline = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/timeline', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      setTimelineData(response.data.entries);
      toast.success(`Found ${response.data.entries.length} entries in the selected period`);
    } catch (error) {
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const generateNarrative = async () => {
    if (timelineData.length === 0) {
      toast.error('No entries found for the selected period');
      return;
    }

    setNarrating(true);
    const toastId = toast.loading('Generating your narrative...');

    try {
      // Prepare the data for narrative generation
      const entriesData = timelineData
        .filter(day => day.entry)
        .map(day => ({
          date: day.date,
          text_content: day.entry?.text_content || '',
          ai_generated_story: day.entry?.ai_generated_story || ''
        }));

      const response = await axios.post('/api/narrate', {
        entries: entriesData,
        start_date: startDate,
        end_date: endDate
      });

      setNarrative(response.data.narrative);
      setShowNarrative(true);
      toast.success('Narrative generated successfully!', { id: toastId });
      
      // Refresh narrative history
      fetchNarrativeHistory(0);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to generate narrative';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setNarrating(false);
    }
  };

  const generateAudio = async () => {
    if (!narrative) {
      toast.error('No narrative to convert to audio');
      return;
    }

    const toastId = toast.loading('Generating audio...');

    try {
      const response = await axios.post('/api/narrate/audio', {
        text: narrative
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      setAudioBlob(blob);
      setAudioUrl(url);
      toast.success('Audio generated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Audio generation error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate audio';
      toast.error(errorMessage, { id: toastId });
      
      // Fallback to browser TTS
      toast.success('Trying browser text-to-speech as fallback...', { id: toastId });
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(narrative);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Create a simple audio URL for the browser TTS
        const audioElement = new Audio();
        audioElement.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        setAudioUrl(audioElement.src);
        setAudioBlob(null);
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
        toast.success('Using browser text-to-speech', { id: toastId });
      }
    }
  };

  const playAudio = () => {
    if (audioUrl && audioBlob) {
      // Server-generated audio
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } else if (audioUrl && !audioBlob) {
      // Browser TTS fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(narrative);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    setIsPlaying(false);
    // Stop all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `narrative-${startDate}-to-${endDate}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const generateImage = async () => {
    if (!narrative) {
      toast.error('No narrative to generate image from');
      return;
    }

    setGeneratingImage(true);
    const toastId = toast.loading('Generating image...');

    try {
      const response = await axios.post('/api/narrate/image', {
        text: narrative
      });

      setImageUrl(response.data.image_url);
      toast.success('Image generated successfully!', { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to generate image';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (imageUrl) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `narrative-${startDate}-to-${endDate}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
          Narrate Your Life
        </h1>
        <p className="text-lg text-night-text-secondary">
          Select a time period and let AI create a beautiful narrative from your memories
        </p>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={itemVariants}>
        {/* Date Selection */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" />
              Select Time Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent"
              />
            </div>
            <Button 
              onClick={fetchTimeline} 
              loading={loading}
              className="w-full"
            >
              <Calendar className="mr-2" />
              Load Entries
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <div className="space-y-3">
                <p className="text-night-text-secondary">
                  Found <span className="font-semibold text-night-accent">{timelineData.length}</span> entries
                </p>
                <div className="space-y-2">
                  {timelineData.slice(0, 3).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-night-surface rounded">
                      <span className="text-sm">
                        {day.date ? (() => {
                          try {
                            return new Date(day.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch (error) {
                            return day.date;
                          }
                        })() : 'No date'}
                      </span>
                      <span className="text-xs text-night-text-secondary">
                        {day.entry ? 'Has story' : 'No content'}
                      </span>
                    </div>
                  ))}
                  {timelineData.length > 3 && (
                    <p className="text-xs text-night-text-secondary">
                      ... and {timelineData.length - 3} more entries
                    </p>
                  )}
                </div>
                <Button 
                  onClick={generateNarrative}
                  loading={narrating}
                  className="w-full mt-4"
                  disabled={timelineData.length === 0}
                >
                  <Play className="mr-2" />
                  Generate Narrative
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto mb-4 text-night-text-secondary" size={48} />
                <p className="text-night-text-secondary">
                  Select dates and load entries to see your timeline
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Generated Narrative */}
      {showNarrative && (
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 text-night-accent" />
                  Your Narrative
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!audioUrl ? (
                    <Button 
                      onClick={generateAudio}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <Volume2 className="mr-2" size={16} />
                      Generate Audio
                    </Button>
                  ) : (
                    <>
                      {!isPlaying ? (
                        <Button 
                          onClick={playAudio}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <Play className="mr-2" size={16} />
                          Play Audio
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopAudio}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <VolumeX className="mr-2" size={16} />
                          Stop Audio
                        </Button>
                      )}
                      <Button 
                        onClick={downloadAudio}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Download className="mr-2" size={16} />
                        Download Audio
                      </Button>
                    </>
                  )}
                  
                  {!imageUrl ? (
                    <Button 
                      onClick={generateImage}
                      loading={generatingImage}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <ImageIcon className="mr-2" size={16} />
                      Generate Image
                    </Button>
                  ) : (
                    <Button 
                      onClick={downloadImage}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <Download className="mr-2" size={16} />
                      Download Image
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-night-text whitespace-pre-wrap leading-relaxed">
                  {narrative}
                </p>
              </div>
              
              {/* Generated Image */}
              {imageUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <ImageIcon className="mr-2 text-night-accent" />
                    Generated Image
                  </h3>
                  <div className="relative">
                    <img 
                      src={imageUrl} 
                      alt="Narrative illustration" 
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Narrative History */}
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 text-night-accent" />
              Previous Narrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory && narrativeHistory.length === 0 ? (
              <div className="text-center py-8">
                <Loader className="mx-auto mb-4 animate-spin" size={32} />
                <p className="text-night-text-secondary">Loading your narrative history...</p>
              </div>
            ) : narrativeHistory.length > 0 ? (
              <div className="space-y-4">
                {narrativeHistory.map((narrative) => (
                  <div key={narrative.id} className="border border-night-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-night-text">
                          {(() => {
                            try {
                              const start = narrative.start_date ? new Date(narrative.start_date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'No start date';
                              const end = narrative.end_date ? new Date(narrative.end_date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'No end date';
                              return `${start} - ${end}`;
                            } catch (error) {
                              return `${narrative.start_date || 'No start date'} - ${narrative.end_date || 'No end date'}`;
                            }
                          })()}
                        </h3>
                        <p className="text-sm text-night-text-secondary">
                          {narrative.created_at ? (() => {
                            try {
                              return new Date(narrative.created_at).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (error) {
                              return narrative.created_at;
                            }
                          })() : 'No creation date'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Audio Controls */}
                        {narrative.audio_url ? (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => playNarrativeAudio(narrative.audio_url)}
                            >
                              <Play className="mr-1" size={14} />
                              Play
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadNarrativeAudio(narrative.id, narrative.start_date, narrative.end_date)}
                            >
                              <Download className="mr-1" size={14} />
                              Download
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => generateAudioForNarrative(narrative.id, narrative.narrative_text)}
                            loading={generatingAudioFor === narrative.id}
                            variant="outline" 
                            size="sm"
                          >
                            <Volume2 className="mr-1" size={14} />
                            Generate Audio
                          </Button>
                        )}
                        
                        {/* Image Controls */}
                        {narrative.image_url ? (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadNarrativeImage(narrative.image_url, narrative.start_date, narrative.end_date)}
                            >
                              <Download className="mr-1" size={14} />
                              Download
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => generateImageForNarrative(narrative.id, narrative.narrative_text)}
                            loading={generatingImageFor === narrative.id}
                            variant="outline" 
                            size="sm"
                          >
                            <ImageIcon className="mr-1" size={14} />
                            Generate Image
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-night-text">
                        {expandedNarratives.has(narrative.id) 
                          ? narrative.narrative_text
                          : narrative.narrative_text.split('\n').slice(0, 3).join('\n') + (narrative.narrative_text.split('\n').length > 3 ? '...' : '')
                        }
                      </p>
                      {narrative.narrative_text.split('\n').length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleNarrativeExpansion(narrative.id)}
                          className="mt-2"
                        >
                          {expandedNarratives.has(narrative.id) ? 'Show Less' : 'Show More'}
                        </Button>
                      )}
                    </div>

                    {narrative.image_url && (
                      <div className="mb-3">
                        <img 
                          src={narrative.image_url} 
                          alt="Narrative illustration" 
                          className="w-full max-w-xs rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                {narrativeHistory.length < totalHistoryCount && (
                  <div className="text-center pt-4">
                    <Button 
                      onClick={loadMoreHistory}
                      loading={loadingHistory}
                      variant="outline"
                    >
                      Load More Narrations
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto mb-4 text-night-text-secondary" size={48} />
                <p className="text-night-text-secondary">
                  No previous narrations found. Create your first one above!
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