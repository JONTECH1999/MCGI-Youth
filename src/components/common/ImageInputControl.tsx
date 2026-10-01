import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, RotateCcw, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
import { compressAndReadFileAsDataUrl } from '../../utils/imageUtils';

export interface ImagePreset {
  label: string;
  url: string;
}

interface ImageInputControlProps {
  label: string;
  sublabel?: string;
  value: string;
  defaultValue?: string;
  onChange: (newValue: string) => void;
  aspectRatioClass?: string; // e.g. "aspect-video", "aspect-[4/3]", "aspect-[16/9]"
  presets?: ImagePreset[];
  maxWidth?: number;
  maxHeight?: number;
}

export const ImageInputControl: React.FC<ImageInputControlProps> = ({
  label,
  sublabel,
  value,
  defaultValue,
  onChange,
  aspectRatioClass = 'aspect-video',
  presets,
  maxWidth = 1600,
  maxHeight = 1200,
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal url state when external value changes
  React.useEffect(() => {
    setUrlInput(value);
    setImgError(false);
  }, [value]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setIsProcessing(true);
      const dataUrl = await compressAndReadFileAsDataUrl(file, maxWidth, maxHeight);
      onChange(dataUrl);
      setUrlInput(dataUrl);
      setImgError(false);
    } catch (err: any) {
      alert(err.message || 'Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setImgError(false);
    }
  };

  const handleResetDefault = () => {
    if (defaultValue) {
      onChange(defaultValue);
      setUrlInput(defaultValue);
      setImgError(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>{label}</span>
          </label>
          {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto">
          {defaultValue && value !== defaultValue && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] font-semibold text-slate-500 hover:text-amber-800 px-2 py-1 rounded hover:bg-slate-200/60 transition flex items-center gap-1 cursor-pointer"
              title="Reset to default image"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="bg-slate-200/70 p-0.5 rounded-lg flex text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                mode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                mode === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Link
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Preview Container */}
        <div className="md:col-span-5 relative">
          <div
            className={`relative w-full ${aspectRatioClass} rounded-xl overflow-hidden bg-slate-200 border-2 transition-all ${
              isDragging ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-300'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {value && !imgError ? (
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
                <span className="text-[11px] font-medium">
                  {imgError ? 'Image failed to load' : 'No image configured'}
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-2">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Optimizing image...</span>
              </div>
            )}
          </div>
        </div>

        {/* Input / Control Side */}
        <div className="md:col-span-7 space-y-3">
          {mode === 'upload' ? (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-white border-2 border-dashed border-amber-600/50 hover:border-amber-600 hover:bg-amber-50/50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-700" />
                <span>Click to Choose Photo from Device</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Or drag and drop image file directly onto the preview container above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:border-amber-600 outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-3 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Paste any publicly accessible image link (Unsplash, Imgur, direct image URL).
              </p>
            </div>
          )}

          {/* Curated Presets if provided */}
          {presets && presets.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Or pick from curated styles:</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((preset, idx) => {
                  const isSelected = value === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onChange(preset.url);
                        setUrlInput(preset.url);
                        setImgError(false);
                      }}
                      className={`group relative rounded-lg overflow-hidden border-2 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="h-12 bg-slate-200 overflow-hidden relative">
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="p-1 bg-white text-[9px] font-semibold text-slate-700 truncate">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
