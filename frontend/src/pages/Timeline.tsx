import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Mic, Camera } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface TimelineEntry {
  date: string;
  entry?: { id: number; text_content: string; ai_generated_story: string };
  audio_files: any[];
  images: any[];
}

const Timeline: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const response = await axios.get('/api/timeline');
        setTimelineData(response.data.entries);
      } catch (error) {
        toast.error('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Timeline</h1>
      {loading ? (
        <p>Loading timeline...</p>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 h-full w-0.5 bg-night-border"></div>
          {timelineData.map((day, index) => (
            <motion.div 
              key={index} 
              className="mb-8 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-10 h-10 rounded-full bg-night-accent flex-shrink-0 flex items-center justify-center z-10">
                <Calendar size={20} />
              </div>
              <div className="ml-4 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle>{new Date(day.date).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {day.entry && (
                      <Link to={`/story/${day.entry.id}`}>
                        <p className="line-clamp-2">{day.entry.text_content || day.entry.ai_generated_story}</p>
                      </Link>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-night-text-secondary">
                      {day.audio_files.length > 0 && <Mic size={16} />}
                      {day.images.length > 0 && <Camera size={16} />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline; 