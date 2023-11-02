import { useSearchParams } from "react-router-dom";

export function useFilterParams() {
  const [searchParams] = useSearchParams();

  const filters = {
    jobName: searchParams.get("jobName"),
    runDate: searchParams.get("runDate"),
    status: searchParams.get("status"),
  };
  const hasActiveFilters = Object.values(filters).some((f) => !!f);

  return { filters, hasActiveFilters };
}
