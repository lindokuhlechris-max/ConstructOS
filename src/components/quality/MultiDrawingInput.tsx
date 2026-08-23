import React, { useState } from 'react';
import { Plus, X, Layers, FileText } from 'lucide-react';

interface MultiDrawingInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  icon?: 'drawing' | 'document';
  colorTheme?: 'blue' | 'purple';
}

export function MultiDrawingInput({
  values = [],
  onChange,
  placeholder = 'Type number and press Enter or comma...',
  label,
  icon = 'drawing',
  colorTheme = 'blue'
}: MultiDrawingInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (text: string) => {
    const raw = text.trim();
    if (!raw) return;

    // Support comma or semicolon split if pasted
    const splitItems = raw
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newValues = Array.from(new Set([...values, ...splitItems]));
    onChange(newValues);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      // Remove last tag
      onChange(values.slice(0, values.length - 1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(values.filter((_, i) => i !== indexToRemove));
  };

  const IconComp = icon === 'drawing' ? Layers : FileText;
  const themeClasses = colorTheme === 'purple' 
    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
            {label} ({values.length})
          </label>
          {values.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      <div className="min-h-10 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-[#0B5FFF] focus-within:border-transparent transition-all">
        {values.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${themeClasses}`}
          >
            <IconComp className="h-3 w-3 shrink-0" />
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-rose-600 transition-colors"
              title={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[140px] flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }}
            placeholder={values.length === 0 ? placeholder : 'Add another...'}
            className="w-full bg-transparent text-xs font-mono font-semibold px-2 py-1 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-sans"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="p-1 rounded-lg bg-blue-50 text-[#0B5FFF] hover:bg-blue-100 text-xs font-bold shrink-0 flex items-center gap-0.5 px-2"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-400">Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[9px]">Enter</kbd> or type a comma to add multiple references</p>
    </div>
  );
}
