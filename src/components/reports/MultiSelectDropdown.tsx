'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: number | string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: (number | string)[];
  onChange: (newSelectedValues: (number | string)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'All',
  disabled = false,
  className = '',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
    );
  });

  const handleToggleOption = (val: number | string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    const allValues = options.map((opt) => opt.value);
    onChange(allValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const buttonText =
    selectedValues.length === 0
      ? `${label}: ${placeholder}`
      : selectedValues.length === options.length && options.length > 0
      ? `${label}: All (${options.length})`
      : `${label} (${selectedValues.length})`;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-full min-w-[140px] px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:border-slate-400 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all"
      >
        <span className="truncate max-w-[200px]">{buttonText}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180 text-blue-600' : 'text-slate-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-72 mt-1.5 origin-top-left bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden focus:outline-none ring-1 ring-black/5 animate-fadeIn">
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
              autoFocus
            />
            <div className="flex justify-between items-center mt-2 px-1 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">No matching items found</div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = selectedValues.includes(option.value);
                const inputId = `multiselect-${label}-${option.value}`;
                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className="flex items-center px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleOption(option.value)}
                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="ml-2.5 flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate flex items-center justify-between">
                        <span>{option.label}</span>
                        {option.badge && (
                          <span
                            className={`ml-1 px-1.5 py-0.5 text-[9px] rounded uppercase font-bold tracking-wider ${
                              option.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.subLabel && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{option.subLabel}</div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
