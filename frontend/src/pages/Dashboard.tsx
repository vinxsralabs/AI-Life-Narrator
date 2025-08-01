import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Star, FileText, BarChart2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({ totalEntries: 0, storiesGenerated: 0, weeklyStreak: 0 });
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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [entriesRes, statsRes] = await Promise.all([
          axios.get('/api/entries?limit=3'),
          axios.get('/api/dashboard/stats')
        ]);
        
        setRecentEntries(entriesRes.data);
        setStats({ 
          totalEntries: statsRes.data.total_entries, 
          storiesGenerated: statsRes.data.stories_generated,
          weeklyStreak: statsRes.data.weekly_streak
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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
      
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
        <StatCard icon={<FileText size={24} />} label="Total Entries" value={stats.totalEntries} isLoading={loading} />
        <StatCard icon={<Star size={24} />} label="Stories Generated" value={stats.storiesGenerated} isLoading={loading} />
        <StatCard icon={<BarChart2 size={24} />} label="Weekly Streak" value={stats.weeklyStreak} isLoading={loading} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recent Entries</h2>
          <Link to="/upload">
            <Button>
              <Plus size={16} className="mr-2" />
              New Entry
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentEntries.length > 0 ? (
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants}>
            {recentEntries.map((entry) => (
              <motion.div key={entry.id} variants={itemVariants}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex justify-between items-center">
                          <span className="text-sm font-medium text-night-text">
                            {entry.date ? (() => {
                              try {
                                return new Date(entry.date).toLocaleString(undefined, {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              } catch (error) {
                                return entry.date;
                              }
                            })() : 'No date'}
                          </span>
                          {entry.ai_generated_story && <Star size={16} className="text-yellow-400" />}
                        </CardTitle>
                        <CardDescription>{entry.story_style}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(entry.id, entry.date)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-2 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Link to={`/story/${entry.id}`} className="block">
                      <p className="line-clamp-3 hover:text-night-accent transition-colors">
                        {entry.text_content || "View generated story..."}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
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
              <p className="text-night-text-secondary mb-6">Every great story starts with a single word. What's yours?</p>
              <Link to="/upload"><Button size="lg">Create First Entry</Button></Link>
            </CardContent>
          </Card>
        )}
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