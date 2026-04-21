import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogoPath,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  const { t } = useTranslation('admin');
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    isDeleting: false,
    progress: 0,
    error: null,
    previewUrl: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLogoUrl = useCallback(() => {
    if (state.previewUrl) return state.previewUrl;
    if (currentLogoPath) {
      return currentLogoPath.startsWith('http')
        ? currentLogoPath
        : `/api${currentLogoPath}`;
    }
    return null;
  }, [currentLogoPath, state.previewUrl]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('logoUploader.invalidFileType');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('logoUploader.fileSizeExceeds');
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      previewUrl: URL.createObjectURL(file),
    }));

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setState((prev) => ({ ...prev, progress: percentComplete }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const logoPath = response.logoPath || response.path || response.url;
            setState((prev) => ({
              ...prev,
              isUploading: false,
              progress: 100,
              previewUrl: null,
            }));
            onUploadSuccess(logoPath);
          } catch {
            setState((prev) => ({
              ...prev,
              isUploading: false,
              error: t('logoUploader.invalidResponse'),
            }));
          }
        } else {
          let errorMessage = t('logoUploader.uploadFailed');
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || response.error || errorMessage;
          } catch {
            errorMessage = t('logoUploader.uploadFailedHttp', { status: xhr.status });
          }
          setState((prev) => ({
            ...prev,
            isUploading: false,
            error: errorMessage,
            previewUrl: null,
          }));
        }
      });

      xhr.addEventListener('error', () => {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: t('logoUploader.networkError'),
        }));
      });

      xhr.open('POST', '/api/settings/logo');
      xhr.send(formData);
    } catch {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: t('logoUploader.unexpectedError'),
      }));
    }
  };

  const handleDelete = async () => {
    setState((prev) => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch('/api/settings/logo', {
        method: 'DELETE',
      });

      if (response.ok) {
        setState((prev) => ({ ...prev, isDeleting: false }));
        onDeleteSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          isDeleting: false,
          error: data.message || data.error || t('logoUploader.deleteFailed'),
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        error: t('logoUploader.networkError'),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleZoneClick();
    }
  };

  const logoUrl = getLogoUrl();

  return (
    <div className="space-y-spacing-md">
      <label className="block text-text-primary font-semibold text-sm">
        {t('logoUploader.businessLogo')}
      </label>

      <div className="flex flex-col sm:flex-row gap-spacing-lg items-start">
        <div
          role="button"
          tabIndex={0}
          aria-label={t('logoUploader.uploadAriaLabel')}
          onClick={handleZoneClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-32 h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer
            flex items-center justify-center overflow-hidden flex-shrink-0
            ${isDragOver
              ? 'border-amber-500 bg-amber-500/10'
              : isDragOver
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-600 hover:border-slate-500 bg-bg-secondary'
            }
            ${state.isUploading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={t('logoUploader.businessLogoAlt')}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-spacing-sm">
              <svg
                className="mx-auto h-8 w-8 text-text-muted mb-spacing-xs"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-text-muted text-xs">
                {t('logoUploader.clickOrDrop')}
              </p>
            </div>
          )}

          {state.isUploading && (
            <div className="absolute inset-0 bg-bg-secondary/80 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="animate-spin h-6 w-6 text-amber-500 mx-auto mb-spacing-xs"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-text-primary text-xs">{state.progress}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          <div className="space-y-spacing-sm">
            <button
              type="button"
              onClick={handleZoneClick}
              disabled={state.isUploading || state.isDeleting}
              className="btn btn-primary btn-sm"
            >
              {state.isUploading ? t('logoUploader.uploading') : t('logoUploader.uploadLogo')}
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={state.isUploading || state.isDeleting}
                className="btn btn-danger btn-sm ml-spacing-sm"
              >
                {state.isDeleting ? t('logoUploader.deleting') : t('logoUploader.remove')}
              </button>
            )}
          </div>

          <p className="text-text-muted text-xs mt-spacing-sm">
            {t('logoUploader.fileHint')}
          </p>

          {state.isUploading && state.progress > 0 && (
            <div className="mt-spacing-sm">
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          )}

          {state.error && (
            <div
              role="alert"
              className="mt-spacing-sm p-spacing-sm bg-accent-danger/10 border border-accent-danger/30 rounded-md"
            >
              <p className="text-accent-danger text-xs">{state.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
