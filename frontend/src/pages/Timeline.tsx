import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Mic, Camera, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { formatDateTime } from '../utils/timezone';

interface TimelineEntry {
  date: string;
  entry?: { id: number; text_content: string; ai_generated_story: string };
  audio_files: any[];
  images: any[];
}

const Timeline: React.FC = () => {
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);
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

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        // Set a very wide date range to get all records
        const endDate = new Date();
        const startDate = new Date('2020-01-01'); // Start from a very early date
        
        const response = await axios.get('/api/timeline', {
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        });
        setTimelineData(response.data.entries);
      } catch (error) {
        toast.error('Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

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
      
      // Remove the entry from timeline data
      setTimelineData(prev => 
        prev.filter(item => item.entry?.id !== deleteModal.entryId)
      );
      
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

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-night-text">
                        {day.date ? formatDateTime(day.date, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: undefined
                        }) : 'No date'}
                      </CardTitle>
                      {day.entry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(day.entry!.id, day.date)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {day.entry && (
                      <Link to={`/story/${day.entry.id}`}>
                        <p className="line-clamp-2 hover:text-night-accent transition-colors">
                          {formatDateTime(day.date, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZoneName: undefined
                          }).replace(',', '').replace(' ', ', ')}: {day.entry.text_content || day.entry.ai_generated_story}
                        </p>
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
    </div>
  );
};

export default Timeline; 