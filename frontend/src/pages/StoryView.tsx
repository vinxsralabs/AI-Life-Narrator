import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Story {
  id: number;
  date: string;
  text_content: string;
  ai_generated_story: string;
  story_style: string;
}

const StoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await axios.get(`/api/entries/${id}`);
        setStory(response.data);
      } catch (error) {
        toast.error('Failed to load story.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchStory();
    }
  }, [id]);

  const handleRegenerate = async () => {
    if (!story) return;
    setIsRegenerating(true);
    try {
      const response = await axios.post('/api/generate-story', { entry_id: story.id, style: story.story_style });
      setStory(prev => prev ? { ...prev, ai_generated_story: response.data.story } : null);
      toast.success('Story regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate story.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) return <p>Loading story...</p>;
  if (!story) return <p>Story not found.</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/timeline" className="flex items-center gap-2 text-night-accent mb-4">
        <ArrowLeft /> Back to Timeline
      </Link>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl">{new Date(story.date).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}</CardTitle>
            <Button onClick={handleRegenerate} loading={isRegenerating}>
              <RefreshCw className={`mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Your Words</h3>
            <p className="text-night-text-secondary">{story.text_content}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <Sparkles className="mr-2 text-night-accent" /> AI Generated Story ({story.story_style})
            </h3>
            <p className="text-night-text-secondary whitespace-pre-wrap">{story.ai_generated_story}</p>
          </div>
          {/* Audio and Image display to be implemented here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryView; 