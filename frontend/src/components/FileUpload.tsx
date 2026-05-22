import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import '../styles/FileUpload.css';

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
    <div className="upload-wrapper">
      {/* Левая часть — зона загрузки */}
      <div className="dropzone-area">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${isLoading ? 'dropzone-loading' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isLoading ? (
            <>
              <div className="spinner" />
              <div className="dropzone-title">Загрузка...</div>
              <div className="dropzone-subtitle">Парсим данные резюме</div>
            </>
          ) : isDragActive ? (
            <>
              <div className="dropzone-icon">📂</div>
              <div className="dropzone-title">Отпустите файл</div>
              <div className="dropzone-subtitle">Мы обработаем его</div>
            </>
          ) : (
            <>
              <div className="dropzone-icon">📄</div>
              <div className="dropzone-title">Перетащите файл .docx сюда</div>
              <div className="dropzone-subtitle">или кликните для выбора</div>
              <div className="dropzone-hint">Максимум 10 МБ</div>
            </>
          )}
        </div>
      </div>

      {/* Правая часть — описание */}
      <div className="upload-info">
        <h3 className="info-title">Конвертер резюме ТРАЙВ</h3>
        <p className="info-description">
          Загрузите резюме в формате .docx, и мы автоматически распарсим все данные:
        </p>
        <ul className="info-features">
          <li>ФИО и контактные данные</li>
          <li>Опыт работы и проекты</li>
          <li>Образование и навыки</li>
          <li>Языки и технологии</li>
        </ul>
      </div>
    </div>
  );
};