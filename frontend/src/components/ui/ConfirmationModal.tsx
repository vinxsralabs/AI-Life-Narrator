import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'danger'
}) => {
  const iconColor = type === 'danger' ? 'text-red-500' : type === 'warning' ? 'text-yellow-500' : 'text-blue-500';
  const buttonVariant = type === 'danger' ? 'destructive' : 'default';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-night-surface border border-night-border rounded-xl shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-night-border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`${iconColor}`} size={24} />
                  <h2 className="text-lg font-semibold text-night-text">{title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-auto"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-night-text-secondary leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={buttonVariant}
                  onClick={onConfirm}
                  className="flex-1"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;