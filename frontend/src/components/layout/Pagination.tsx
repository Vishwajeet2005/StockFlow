import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-2 bg-surface-0">
      <div className="text-sm text-ink-500">
        Page <span className="font-medium text-ink-900">{page}</span> of <span className="font-medium text-ink-900">{totalPages}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="btn btn-secondary btn-sm p-1.5"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="btn btn-secondary btn-sm p-1.5"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
