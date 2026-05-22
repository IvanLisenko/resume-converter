import '../styles/ErrorAlert.css';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => {
  if (!message) return null;

  return (
    <div className="error-alert">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="error-close">
          ✕
        </button>
      )}
    </div>
  );
};