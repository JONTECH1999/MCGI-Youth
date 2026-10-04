import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const isBusy = isLoading || isSubmitting;

  useEffect(() => {
    if (isOpen) setActionError('');
  }, [isOpen]);

  const handleClose = () => {
    if (!isBusy) onClose();
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The action could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <div className="sm:flex sm:items-start">
        {getIcon()}
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      {actionError && <p className="mt-4 text-sm text-rose-700" role="alert">{actionError}</p>}

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isBusy}
          className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isBusy}
          className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-xs focus:outline-hidden disabled:opacity-50 ${getButtonClass()}`}
        >
          {isBusy ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
