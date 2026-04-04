import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;

interface UseSearchPaginationOptions<T> {
  items: T[];
  searchKey: (item: T) => string;
}

export function useSearchPagination<T>({ items, searchKey }: UseSearchPaginationOptions<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const searched = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => searchKey(item).toLowerCase().includes(q));
  }, [items, search, searchKey]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => searched.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [searched, safePage]
  );

  // Reset page when search changes
  const setSearchAndReset = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return {
    search,
    setSearch: setSearchAndReset,
    page: safePage,
    setPage,
    totalPages,
    paginated,
    totalFiltered: searched.length,
  };
}

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalFiltered: number;
  totalItems: number;
  search: string;
  onSearchChange: (val: string) => void;
  onPageChange: (page: number) => void;
  placeholder?: string;
}

export function SearchPaginationBar({
  page, totalPages, totalFiltered, totalItems, search, onSearchChange, onPageChange, placeholder = "Search tests…",
}: PaginationBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-xs h-8 pl-8 bg-card"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
          {totalFiltered === totalItems ? `${totalItems} total` : `${totalFiltered} of ${totalItems}`}
        </span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            className="font-mono text-xs h-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Prev
          </Button>
          <span className="font-mono text-[10px] text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            className="font-mono text-xs h-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
