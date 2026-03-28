import React, { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { useResolveUrl } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface UrlLoaderProps {
  onLoaded: (code: string, language?: string) => void;
}

export function UrlLoader({ onLoaded }: UrlLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const resolveMutation = useResolveUrl();

  const handleLoad = async () => {
    if (!url) return;
    try {
      const data = await resolveMutation.mutateAsync({ data: { url } });
      onLoaded(data.code, data.language);
      setIsOpen(false);
      setUrl("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Load from URL (GitHub, Gist, etc.)
        </button>
      ) : (
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl border border-border/50">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste GitHub or Raw URL..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={!url || resolveMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
      
      {resolveMutation.isError && (
        <p className="text-xs text-destructive mt-2 px-3">
          {resolveMutation.error?.message || "Failed to load URL. Make sure it's public."}
        </p>
      )}
    </div>
  );
}
