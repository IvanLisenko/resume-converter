interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-red-100 text-red-700 rounded-md">
      <span>⚠️ {message}</span>
      {onClose && (
        <button onClick={onClose} className="text-red-700 hover:text-red-900">
          ✕
        </button>
      )}
    </div>
  );
};