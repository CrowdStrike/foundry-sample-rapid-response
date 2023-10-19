import { useSearchParams } from "react-router-dom";

interface Args {
  pageUrl: "/all-jobs" | "/run-history" | "/audit-log";
}

export function useUrlParamsTools({ pageUrl }: Args) {
  const [searchParams] = useSearchParams();

  return {
    get: (name: string) => {
      return searchParams.get(name);
    },
    set: (target: Record<string, string>): string => {
      for (const [key, value] of Object.entries(target)) {
        searchParams.set(key, value);
      }

      return `${pageUrl}?${String(searchParams)}`;
    },
    remove: (target: string[]): string => {
      for (const key of target) {
        searchParams.delete(key);
      }

      return `${pageUrl}?${String(searchParams)}`;
    },
  };
}
