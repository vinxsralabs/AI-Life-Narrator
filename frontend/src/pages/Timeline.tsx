import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mic, Camera, Trash2, X } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

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

  const openImageModal = (image: any) => {
    const imageUrl = `/uploads/images/${image.filename}`;
    setSelectedImage({ src: imageUrl, alt: image.description || 'Uploaded image' });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
                      <div>
                        <p className="line-clamp-none text-night-text mb-2">
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
                      </div>
                    )}
                    
                    {/* Show timestamp for standalone content (no text entry) */}
                    {!day.entry && (day.images.length > 0 || day.audio_files.length > 0) && (
                      <p className="text-night-text-secondary text-sm mb-2">
                        {formatDateTime(day.date, {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: undefined
                        })}
                      </p>
                    )}
                    
                    {/* Display Images */}
                    {day.images.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2 text-night-text-secondary">
                          <Camera size={16} />
                          <span className="text-sm">{day.images.length} image{day.images.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {day.images.map((image, imgIndex) => (
                            <div 
                              key={imgIndex}
                              className="relative group cursor-pointer"
                              onClick={() => openImageModal(image)}
                            >
                              <img
                                src={`/uploads/images/${image.filename}`}
                                alt={image.description || 'Uploaded image'}
                                className="w-full h-24 object-cover rounded-md hover:opacity-80 transition-opacity"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Show fallback content
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center">
                                        <Camera size={20} class="text-gray-400" />
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera size={20} className="text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
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