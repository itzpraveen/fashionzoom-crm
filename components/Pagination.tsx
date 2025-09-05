'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Number of items per page */
  pageSize?: number
  /** Total number of items across all pages */
  totalItems?: number
}

/**
 * Pagination component for navigating through pages of data
 * 
 * Features:
 * - Smart page number display with ellipsis for large page counts
 * - Previous/Next navigation buttons
 * - Shows current range of items
 * - Fully accessible with ARIA labels
 * - URL-based navigation using search params
 * 
 * @example
 * ```tsx
 * <Pagination 
 *   currentPage={2} 
 *   totalPages={10} 
 *   pageSize={20}
 *   totalItems={195} 
 * />
 * ```
 */
export function Pagination({ currentPage, totalPages, pageSize = 10, totalItems }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const createPageURL = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `?${params.toString()}`
  }, [searchParams])

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page))
  }

  if (totalPages <= 1) return null

  const pages = []
  const showEllipsis = totalPages > 7
  
  if (showEllipsis) {
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted">
        {totalItems && (
          <>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === page 
                  ? 'bg-primary text-white' 
                  : 'hover:bg-white/10'
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}