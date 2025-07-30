import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mic, Camera, FileText, Sparkles, Check, Upload as UploadIcon, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [textContent, setTextContent] = useState('');
  const [storyStyle, setStoryStyle] = useState('story');
  const [audioBlob] = useState<Blob | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!textContent && images.length === 0 && !audioBlob) {
      toast.error("Please add some content before creating an entry.");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Creating your new entry...');

    try {
      const entryResponse = await axios.post('/api/entries', {
        text_content: textContent,
        story_style: storyStyle,
      });
      const entryId = entryResponse.data.id;
      
      const uploadPromises = [];

      if (audioBlob) {
        const audioFormData = new FormData();
        audioFormData.append('file', audioBlob, 'recording.wav');
        uploadPromises.push(axios.post(`/api/upload/audio?entry_id=${entryId}`, audioFormData));
      }

      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach(image => imageFormData.append('files', image));
        imageFormData.append('entry_id', String(entryId));
        uploadPromises.push(axios.post(`/api/upload/image`, imageFormData));
      }

      await Promise.all(uploadPromises);
      
      toast.success('Entry created! Taking you to the story...', { id: toastId });
      navigate(`/story/${entryId}`);

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
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Create a New Memory</h1>
        <p className="text-lg text-night-text-secondary">Combine your thoughts, voice, and snapshots into a beautiful story.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <Card variant="elevated">
            <CardContent>
              <label htmlFor="text-content" className="flex items-center text-lg font-medium mb-2">
                <FileText className="inline-block mr-2" /> Your Thoughts
              </label>
              <div className="relative">
                <textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full h-48 p-3 bg-night-surface rounded-md focus:ring-2 focus:ring-night-accent transition-shadow"
                  placeholder="What happened today? How are you feeling?"
                  maxLength={MAX_CHARS}
                />
                <p className="absolute bottom-2 right-2 text-xs text-night-text-secondary">
                  {textContent.length} / {MAX_CHARS}
                </p>
              </div>
            </CardContent>
          </Card>
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
                <div className="flex items-center justify-center h-24 bg-night-surface rounded-md">
                  <p className="text-night-text-secondary">Audio recording coming soon!</p>
                </div>
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
          <Check className="mr-2" /> Create My Story
        </Button>
      </div>
    </motion.div>
  );
};

export default Upload; 