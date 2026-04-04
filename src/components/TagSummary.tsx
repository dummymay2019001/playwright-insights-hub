import { Badge } from "@/components/ui/badge";

interface TagSummaryProps {
  tags: { tag: string; total: number; passed: number; failed: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagSummary({ tags, selectedTag, onSelectTag }: TagSummaryProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelectTag(null)}
        className={`rounded-lg border px-3 py-2 text-left transition-colors shadow-sm ${
          selectedTag === null ? "bg-primary/10 border-primary/30" : "bg-card hover:bg-accent/40"
        }`}
      >
        <p className="font-mono text-xs font-medium text-foreground">All Tags</p>
      </button>
      {tags.map((t) => {
        const rate = t.total > 0 ? Math.round((t.passed / t.total) * 100) : 0;
        const isActive = selectedTag === t.tag;
        return (
          <button
            key={t.tag}
            onClick={() => onSelectTag(isActive ? null : t.tag)}
            className={`rounded-lg border px-3 py-2 text-left transition-colors shadow-sm ${
              isActive ? "bg-primary/10 border-primary/30" : "bg-card hover:bg-accent/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">{t.tag}</Badge>
              <span className={`font-mono text-[10px] font-semibold ${rate >= 95 ? "text-success" : rate >= 80 ? "text-warning" : "text-destructive"}`}>
                {rate}%
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              {t.passed}✓ {t.failed}✗ / {t.total}
            </p>
          </button>
        );
      })}
    </div>
  );
}
