import { useNavigate } from "react-router-dom";

import { Bar } from "@/components/pagination/PaginationBar";
import { useUrlParamsTools } from "@/lib/hooks/use-url-params-tools";

interface Props {
  meta: {
    total: number;
    limit: number;
    next: string;
    prev: string;
    offset: string;
    page: number;
  };
  route: "/all-jobs" | "/run-history" | "/audit-log";
}

export function Wrapper({ meta, route }: Props) {
  const navigate = useNavigate();
  const { set } = useUrlParamsTools({ pageUrl: route });
  const { limit, prev, next, offset } = meta;

  const handleItemsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmpItemsPerPage = parseInt(e.target.value);
    navigate(set({ limit: String(tmpItemsPerPage), offset: "" }));
  };

  const handleChangePage = (direction: "prev" | "next") => () => {
    const options = {
      limit: String(limit),
      ...(direction === "next" && next !== "" && { next: next, prev: "" }),
      ...(direction === "prev" && prev !== "" && { prev: prev, next: "" }),
      offset,
    };
    navigate(set(options));
  };

  return (
    <Bar
      meta={meta}
      handleChangePage={handleChangePage}
      handleItemsPerPage={handleItemsPerPage}
    />
  );
}
