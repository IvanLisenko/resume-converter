import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload = ({ onUpload, isLoading }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !isLoading) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload, isLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка и парсинг файла...</p>
        </div>
      ) : isDragActive ? (
        <p className="text-lg text-blue-600">Отпустите файл здесь</p>
      ) : (
        <div>
          <p className="text-lg">📄 Перетащите файл .docx сюда</p>
          <p className="text-sm text-gray-500 mt-1">или кликните для выбора</p>
          <p className="text-xs text-gray-400 mt-2">Максимум 10 МБ</p>
        </div>
      )}
    </div>
  );
};