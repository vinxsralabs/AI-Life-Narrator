import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Home, 
  Calendar, 
  Upload, 
  LogOut, 
  User,
  Menu,
  X,
  Mic,
  PlusCircle,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/Button';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/timeline', label: 'Timeline', icon: Calendar },
    { path: '/upload', label: 'Create', icon: PlusCircle },
    { path: '/narrate', label: 'Narrate', icon: Mic },
    { path: '/my-reflections', label: 'My Reflections', icon: Sparkles },
    { path: '/therapy', label: 'Talk2Me', icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-night-surface/80 backdrop-blur-xl border-b border-night-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: 360, scale: 1.1 }}>
              <Moon className="text-2xl text-night-accent" />
            </motion.div>
            <span className="text-xl font-bold text-night-text">Life Narrator</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button variant={isActive(item.path) ? 'default' : 'ghost'}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-night-text">{user?.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={16} />
              </Button>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-night-surface/95"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant={isActive(item.path) ? 'default' : 'ghost'} className="w-full justify-start">
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
              <div className="border-t border-night-border/50 pt-4 mt-4">
                <div className="flex items-center gap-3 px-4 py-2">
                  <User size={20} />
                  <span className="font-medium">{user?.username}</span>
                </div>
                <Button variant="ghost" onClick={logout} className="w-full justify-start text-night-error">
                  <LogOut size={20} />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar; 