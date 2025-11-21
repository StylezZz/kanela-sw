import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export const useToast = () => {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = [title, description].filter(Boolean).join(': ');

    if (variant === 'destructive') {
      sonnerToast.error(message || title || description);
    } else {
      sonnerToast.success(message || title || description);
    }
  };

  return { toast };
};
