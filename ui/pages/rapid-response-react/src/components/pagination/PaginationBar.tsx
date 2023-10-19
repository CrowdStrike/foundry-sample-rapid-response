import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

interface Props {
  meta: {
    total: number;
    limit: number;
    next: string;
    prev: string;
    offset: string;
    page: number;
  };
  handleChangePage: (direction: "prev" | "next") => () => void;
  handleItemsPerPage: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Bar({ meta, handleChangePage, handleItemsPerPage }: Props) {
  const { limit, page, total, prev, next } = meta;

  return (
    <div className="bg-csdetailsbg border-cstablecolorborder border-t-[1.5px] w-full h-12 fixed bottom-0 z-40">
      <div className="flex items-center h-full justify-between">
        <div className="flex items-center h-full pl-4">
          <div>
            {total} results{" "}
            <span className="text-csbodyandlabels">
              ({(page - 1) * limit + 1}-
              {page * limit <= total ? page * limit : total} shown)
            </span>
          </div>
          <div className="ml-4 pl-4 h-6 border-l-[1.5px] border-csmezzanine flex items-center">
            Items per page
            <select
              value={limit}
              name="itemsPerPage"
              onChange={handleItemsPerPage}
              className="ml-2 p-1 pr-2 border border-solid border-r-4 shadow-csbutton border-variantDark rounded-sm cursor-pointer bg-variantDark flex justify-between"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
        <div className="flex items-center pr-4">
          <div>
            Page {page} of {Math.ceil(total / limit)}
          </div>
          <div className="flex items-center ml-4 gap-1.5">
            <button
              disabled={prev === ""}
              aria-disabled={prev === "" ? "true" : "false"}
              className={`p-2 h-8 w-8 bg-variantDark border border-solid shadow-csbutton border-csinputcolorborder text-center text-xs rounded-sm flex items-center ${
                prev === ""
                  ? "!opacity-50 cursor-not-allowed"
                  : "bg-variantDark cursor-pointer"
              }`}
              onClick={handleChangePage("prev")}
            >
              <span className="text-[14px] mt-1">
                <SlIcon name="chevron-left" />
              </span>
            </button>
            <button
              disabled={next === ""}
              aria-disabled={next === "" ? "true" : "false"}
              className={`p-2 h-8 w-8 bg-variantDark border border-solid shadow-csbutton border-csinputcolorborder text-center text-xs rounded-sm flex items-center ${
                next === ""
                  ? "!opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              onClick={handleChangePage("next")}
            >
              <span className="text-[14px] mt-1 ml-0.5">
                <SlIcon name="chevron-right" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
