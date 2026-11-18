import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Image as ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadPostMedia } from '../lib/storageService';

interface MediaUploadZoneProps {
  mediaUrl: string | null;
  onMediaChange: (nextUrl: string | null) => void;
  compact?: boolean;
}

export function MediaUploadZone({
  mediaUrl,
  onMediaChange,
  compact = false,
}: MediaUploadZoneProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!user) return;
    setErrorMsg(null);
    setStorageNotice(null);
    setUploading(true);
    setProgress(10);

    try {
      const result = await uploadPostMedia(file, user, (pct) => setProgress(pct));
      onMediaChange(result.publicUrl);
      if (result.warning) {
        setStorageNotice(result.warning);
      } else if (result.source === 'supabase-storage') {
        setStorageNotice('Uploaded to Supabase Storage (post-media).');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Media Attachment (post-media)
        </span>
        {mediaUrl && (
          <button
            type="button"
            onClick={() => {
              onMediaChange(null);
              setStorageNotice(null);
              setErrorMsg(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
      />

      {mediaUrl ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center gap-3.5">
          <div className="w-20 h-14 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shrink-0">
            <img
              src={mediaUrl}
              alt="Uploaded post media preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              Image attached to campaign
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {uploading ? 'Uploading replacement...' : 'Replace image'}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-lg border border-dashed transition-colors cursor-pointer text-center ${
            compact ? 'p-4' : 'p-5'
          } ${
            dragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 hover:border-indigo-500/60'
          }`}
        >
          {uploading ? (
            <div className="space-y-2.5 max-w-xs mx-auto">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono tabular-nums">Uploading {progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
                {dragging ? (
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Drag and drop an image here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 underline">
                  browse files
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PNG, JPG, WEBP, GIF up to 5 MB
              </p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {errorMsg}
        </p>
      )}
      {storageNotice && !errorMsg && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {storageNotice}
        </p>
      )}
    </div>
  );
}
