import React, { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders, apiUrl } from '../services/apiBase';

interface LogoUploaderProps {
  currentLogoPath?: string | null;
  onUploadSuccess: (logoPath: string) => void;
  onDeleteSuccess: () => void;
}

interface UploadState {
  isUploading: boolean;
  isDeleting: boolean;
  progress: number;
  error: string | null;
  previewUrl: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogoPath,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    isDeleting: false,
    progress: 0,
    error: null,
    previewUrl: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    const isValidType = ALLOWED_TYPES.includes(file.type);
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType && !hasValidExtension) {
      return t('logoUploader.error.invalidType', 'Invalid file type. Only PNG, JPG, and SVG are allowed.');
    }

    if (file.size > MAX_FILE_SIZE) {
      return t('logoUploader.error.fileTooLarge', 'File size exceeds 2MB limit.');
    }

    return null;
  }, [t]);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setState(prev => ({
      ...prev,
      error: null,
      isUploading: true,
      progress: 0,
      previewUrl: URL.createObjectURL(file),
    }));

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setState(prev => ({ ...prev, progress: percentComplete }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            setState(prev => ({
              ...prev,
              isUploading: false,
              progress: 100,
            }));
            onUploadSuccess(response.logoPath || response.path || '');
          } catch {
            setState(prev => ({
              ...prev,
              isUploading: false,
              error: t('logoUploader.error.uploadFailed', 'Upload failed. Please try again.'),
            }));
          }
        } else {
          let errorMessage = t('logoUploader.error.uploadFailed', 'Upload failed. Please try again.');
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.error || errorMessage;
          } catch {
            // Use default error message
          }
          setState(prev => ({
            ...prev,
            isUploading: false,
            error: errorMessage,
            previewUrl: currentLogoPath ? null : prev.previewUrl,
          }));
        }
      });

      xhr.addEventListener('error', () => {
        setState(prev => ({
          ...prev,
          isUploading: false,
          error: t('logoUploader.error.networkError', 'Network error. Please check your connection.'),
        }));
      });

      xhr.open('POST', apiUrl('/api/settings/logo'));
      const headers = getAuthHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.send(formData);
    } catch {
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: t('logoUploader.error.uploadFailed', 'Upload failed. Please try again.'),
      }));
    }
  }, [validateFile, t, onUploadSuccess, currentLogoPath]);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
      event.target.value = '';
    }
  }, [handleFile]);

  const handleDelete = useCallback(async () => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch(apiUrl('/api/settings/logo'), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        setState(prev => ({ ...prev, isDeleting: false, previewUrl: null }));
        onDeleteSuccess();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setState(prev => ({
          ...prev,
          isDeleting: false,
          error: errorData.error || t('logoUploader.error.deleteFailed', 'Failed to delete logo.'),
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: t('logoUploader.error.networkError', 'Network error. Please check your connection.'),
      }));
    }
  }, [t, onDeleteSuccess]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBrowseClick();
    }
  }, [handleBrowseClick]);

  const logoUrl = state.previewUrl || (currentLogoPath ? apiUrl(currentLogoPath) : null);

  return (
    <div className="space-y-4">
      <label className="block text-slate-300 font-medium">
        {t('logoUploader.label', 'Business Logo')}
      </label>

      {logoUrl && !state.isUploading && (
        <div className="relative inline-block">
          <img
            src={logoUrl}
            alt={t('logoUploader.currentLogoAlt', 'Current business logo')}
            className="max-h-32 max-w-48 object-contain rounded-md border border-slate-600 bg-slate-700"
          />
          <button
            onClick={handleDelete}
            disabled={state.isDeleting}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors"
            title={t('logoUploader.deleteTooltip', 'Remove logo')}
            aria-label={t('logoUploader.deleteAria', 'Remove current logo')}
          >
            x
          </button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        onClick={handleBrowseClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver
            ? 'border-amber-500 bg-amber-500/10'
            : state.error
              ? 'border-red-500 bg-red-500/5'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }
          ${state.isUploading || state.isDeleting ? 'cursor-not-allowed opacity-50' : ''}
        `}
        aria-label={t('logoUploader.dropzoneAria', 'Drag and drop or click to upload logo')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          onChange={handleFileInput}
          className="hidden"
          disabled={state.isUploading || state.isDeleting}
          aria-hidden="true"
        />

        {state.isUploading ? (
          <div className="space-y-2">
            <div className="text-slate-300">
              {t('logoUploader.uploading', 'Uploading...')} {state.progress}%
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
                role="progressbar"
                aria-valuenow={state.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        ) : state.isDeleting ? (
          <div className="text-slate-300">
            {t('logoUploader.deleting', 'Deleting...')}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-slate-300">
              {isDragOver
                ? t('logoUploader.dropHere', 'Drop file here')
                : t('logoUploader.dropzoneText', 'Drag and drop or click to upload')
              }
            </div>
            <div className="text-slate-500 text-sm">
              {t('logoUploader.allowedFormats', 'PNG, JPG, SVG (max 2MB)')}
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
          {state.error}
        </div>
      )}
    </div>
  );
};
