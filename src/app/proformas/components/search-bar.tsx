'use client';

import { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (term: string) => void;
  value?: string;
}

export default function SearchBar({ onSearch, value = '' }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);

  // Actualizar searchTerm cuando cambia value desde fuera
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form className="w-full max-w-sm" onSubmit={handleSubmit}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          placeholder="Buscar proformas..."
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <button
          type="submit"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          Buscar
        </button>
      </div>
    </form>
  );
} 