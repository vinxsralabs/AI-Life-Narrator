import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Clock,
  BarChart3,
  Smile,
  Frown,
  Meh,
  Star,
  Camera,
  Mic,
  BookOpen,
  ChevronRight,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Award,
  Zap
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/timezone';

interface MoodEntry {
  date: string;
  mood_value: number;
  mood_emoji: string;
  mood_note?: string;
  timestamp: string;
}

interface MoodStats {
  average_mood: number;
  mood_trend: string;
  total_entries: number;
  mood_distribution: { [key: number]: number };
}

interface Highlight {
  id: number;
  date: string;
  title: string;
  content: string;
  ai_story: string;
  type: string;
  timestamp: string;
  years_ago?: number;
}

interface HighlightsData {
  recent_highlights: Highlight[];
  on_this_day: Highlight[];
  weekly_summary: string;
  mood_insights: string | null;
}

const MyReflections: React.FC = () => {
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [moodTimeline, setMoodTimeline] = useState<MoodEntry[]>([]);
  const [highlights, setHighlights] = useState<HighlightsData | null>(null);
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [moodNote, setMoodNote] = useState('');
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'mood'>('highlights');
  const [timeRange, setTimeRange] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const moodEmojis: Record<number, string> = {
    1: '😢',
    2: '😕', 
    3: '😐',
    4: '😊',
    5: '😄'
  };

  const moodLabels: Record<number, string> = {
    1: 'Very Sad',
    2: 'Sad',
    3: 'Neutral', 
    4: 'Happy',
    5: 'Very Happy'
  };

  const moodColors: Record<number, string> = {
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-emerald-500'
  };

  const moodBgColors: Record<number, string> = {
    1: 'bg-red-100 dark:bg-red-900/30',
    2: 'bg-orange-100 dark:bg-orange-900/30',
    3: 'bg-yellow-100 dark:bg-yellow-900/30',
    4: 'bg-green-100 dark:bg-green-900/30',
    5: 'bg-emerald-100 dark:bg-emerald-900/30'
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [moodStatsRes, moodTimelineRes, highlightsRes] = await Promise.all([
        axios.get(`/api/mood/stats?days=${timeRange}`),
        axios.get(`/api/mood/timeline?days=${timeRange}`),
        axios.get('/api/highlights')
      ]);

      setMoodStats(moodStatsRes.data);
      setMoodTimeline(moodTimelineRes.data.timeline);
      setHighlights(highlightsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load reflections data');
    } finally {
      setIsLoading(false);
    }
  };

  const submitMoodEntry = async () => {
    if (!currentMood) return;
    
    setIsSubmittingMood(true);
    try {
      await axios.post('/api/mood', {
        mood_value: currentMood,
        mood_emoji: moodEmojis[currentMood],
        mood_note: moodNote.trim() || null,
        date: new Date().toISOString()
      });
      
      toast.success('Mood recorded! 🎉');
      setMoodNote('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error submitting mood:', error);
      toast.error('Failed to record mood');
    } finally {
      setIsSubmittingMood(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': 
        return <div className="flex items-center gap-1 text-green-500">
          <ArrowUp size={20} />
          <span className="text-sm font-medium">Improving</span>
        </div>;
      case 'declining': 
        return <div className="flex items-center gap-1 text-red-500">
          <ArrowDown size={20} />
          <span className="text-sm font-medium">Declining</span>
        </div>;
      default: 
        return <div className="flex items-center gap-1 text-yellow-500">
          <Minus size={20} />
          <span className="text-sm font-medium">Stable</span>
        </div>;
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      return formatDate(dateStr, {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        timeZoneName: undefined
      });
    } catch {
      return dateStr;
    }
  };

  const toggleFavorite = async (entryId: number) => {
    try {
      await axios.post(`/api/highlights/favorite/${entryId}`);
      toast.success('Favorite updated!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-night-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="mr-3 text-purple-500" size={32} />
          <h1 className="text-4xl font-bold text-night-text">My Reflections</h1>
        </div>
        <p className="text-lg text-night-text-secondary">
          Relive your memories and track your emotional journey
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-night-surface border border-night-border rounded-lg p-1 flex">
          <Button
            variant={activeTab === 'highlights' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('highlights')}
            className="flex items-center gap-2"
          >
            <Star size={16} />
            Highlights
          </Button>
          <Button
            variant={activeTab === 'mood' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('mood')}
            className="flex items-center gap-2"
          >
            <Heart size={16} />
            Mood Tracker
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'highlights' && (
          <motion.div
            key="highlights"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Weekly Summary */}
            {highlights?.weekly_summary && (
              <Card variant="elevated" className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="text-yellow-500" size={24} />
                    Your Week in Review
                    <Zap className="text-yellow-400" size={16} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-night-text leading-relaxed text-lg">
                    {highlights.weekly_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* On This Day */}
            {highlights?.on_this_day && highlights.on_this_day.length > 0 && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Clock className="text-blue-500" size={24} />
                    On This Day
                    <span className="text-sm font-normal text-night-text-secondary">
                      Memories from the past
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {highlights.on_this_day.map((memory, index) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-5 bg-night-card rounded-lg border border-night-border hover:border-night-accent transition-all duration-300 hover:shadow-lg group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-night-text text-lg">{memory.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-night-text-secondary bg-night-surface px-3 py-1 rounded-full">
                            {memory.years_ago} year{memory.years_ago !== 1 ? 's' : ''} ago
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(memory.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star size={16} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-night-text-secondary leading-relaxed">
                        {memory.ai_story || memory.content}
                      </p>
                                              <div className="flex items-center gap-2 mt-3 text-xs text-night-text-secondary">
                          <Calendar size={12} />
                          {formatDateDisplay(memory.date)}
                        </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Highlights */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="text-purple-500" size={24} />
                  Recent Memories
                  <span className="text-sm font-normal text-night-text-secondary">
                    Your latest moments
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {highlights?.recent_highlights?.slice(0, 6).map((highlight, index) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-night-card rounded-lg border border-night-border hover:border-night-accent transition-all duration-300 hover:shadow-lg hover:scale-105 group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="text-night-accent" size={16} />
                          <span className="text-xs text-night-text-secondary">
                            {formatDateDisplay(highlight.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(highlight.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Star size={14} />
                          </Button>
                          <ChevronRight 
                            className="text-night-text-secondary group-hover:text-night-accent transition-colors" 
                            size={16} 
                          />
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-night-text mb-2 group-hover:text-night-accent transition-colors">
                        {highlight.title}
                      </h4>
                      
                      <p className="text-sm text-night-text-secondary leading-relaxed line-clamp-3">
                        {highlight.ai_story || highlight.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Today's Mood Entry */}
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                <CardTitle className="flex items-center gap-3">
                  <Heart className="text-pink-500" size={24} />
                  How are you feeling today?
                  <Target className="text-pink-400" size={16} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Mood Selection */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    {Object.entries(moodEmojis).map(([value, emoji]) => (
                      <motion.button
                        key={value}
                        onClick={() => setCurrentMood(parseInt(value))}
                        className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-110 relative ${
                          currentMood === parseInt(value)
                            ? `${moodBgColors[parseInt(value)]} border-2 border-current shadow-lg scale-110`
                            : 'bg-night-surface hover:bg-night-card border-2 border-transparent'
                        } ${moodColors[parseInt(value)]}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-3xl mb-2">{emoji}</span>
                        <span className="text-xs font-medium text-center">{moodLabels[parseInt(value)]}</span>
                        {currentMood === parseInt(value) && (
                          <motion.div
                            layoutId="moodSelector"
                            className="absolute inset-0 border-2 border-current rounded-xl"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <span className="text-lg font-medium text-night-text">
                      Selected: {moodEmojis[currentMood]} {moodLabels[currentMood]}
                    </span>
                  </div>
                </div>

                {/* Mood Note */}
                <div>
                  <label className="block text-sm font-medium text-night-text mb-2">
                    What's influencing your mood? (optional)
                  </label>
                  <textarea
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="Share what's on your mind..."
                    className="w-full p-4 bg-night-surface border border-night-border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-right text-xs text-night-text-secondary mt-1">
                    {moodNote.length}/200
                  </div>
                </div>

                <Button
                  onClick={submitMoodEntry}
                  loading={isSubmittingMood}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium py-3"
                >
                  Record Today's Mood 🎯
                </Button>
              </CardContent>
            </Card>

            {/* Mood Statistics */}
            {moodStats && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden">
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className="text-4xl font-bold text-night-accent mb-2">
                      {moodStats.average_mood.toFixed(1)}
                    </div>
                    <div className="text-sm text-night-text-secondary mb-1">Average Mood</div>
                    <div className="text-xs text-night-text-secondary">
                      Last {timeRange} days
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl">
                        {moodEmojis[Math.round(moodStats.average_mood) as keyof typeof moodEmojis]}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500"></div>
                    <div className="flex items-center justify-center mb-3">
                      {getTrendIcon(moodStats.mood_trend)}
                    </div>
                    <div className="text-xs text-night-text-secondary">Mood Trend</div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <div className="text-4xl font-bold text-night-accent mb-2">
                      {moodStats.total_entries}
                    </div>
                    <div className="text-sm text-night-text-secondary mb-1">Entries Logged</div>
                    <div className="text-xs text-night-text-secondary">
                      Keep it up! 🎉
                    </div>
                    <div className="mt-3">
                      <Award className="text-yellow-500 mx-auto" size={24} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mood Distribution */}
            {moodStats && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="text-blue-500" size={24} />
                    Mood Distribution
                    <span className="text-sm font-normal text-night-text-secondary">
                      Your emotional patterns
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(moodStats.mood_distribution).map(([mood, count]) => {
                      const percentage = moodStats.total_entries > 0 
                        ? (count / moodStats.total_entries) * 100 
                        : 0;
                      
                      return (
                        <div key={mood} className="flex items-center gap-4">
                          <span className="text-2xl w-10">{moodEmojis[parseInt(mood)]}</span>
                          <span className="text-sm w-24 text-night-text-secondary">
                            {moodLabels[parseInt(mood)]}
                          </span>
                          <div className="flex-1 bg-night-surface rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: parseInt(mood) * 0.1 }}
                              className={`h-full ${
                                parseInt(mood) <= 2 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                parseInt(mood) === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                'bg-gradient-to-r from-green-500 to-green-400'
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-night-text-secondary w-12 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                            <span className="text-xs text-night-text-secondary w-8 text-right">
                              ({count})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Mood Timeline */}
            {moodTimeline.length > 0 && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Calendar className="text-green-500" size={24} />
                    Recent Mood History
                    <span className="text-sm font-normal text-night-text-secondary">
                      Your emotional journey
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {moodTimeline.slice(0, 14).map((entry, index) => (
                      <motion.div
                        key={entry.timestamp}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-night-card rounded-lg hover:bg-night-surface transition-colors border border-night-border hover:border-night-accent"
                      >
                        <span className="text-3xl">{entry.mood_emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium text-night-text">
                              {formatDateDisplay(entry.date)}
                            </span>
                            <span className={`text-sm font-medium ${moodColors[entry.mood_value]}`}>
                              {moodLabels[entry.mood_value]}
                            </span>
                            <span className="text-xs text-night-text-secondary bg-night-surface px-2 py-1 rounded">
                              {entry.mood_value}/5
                            </span>
                          </div>
                          {entry.mood_note && (
                            <p className="text-sm text-night-text-secondary">
                              {entry.mood_note}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyReflections;