import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { DateFormatString } from "@/lib/utils/datetime";

import mapRowTypeToTableRow from "@/components/table-details/Row";

export interface BodyColumnLink {
  label: string;
  type: "link";
  href: string;
}

export interface BodyColumnStatus {
  label: string;
  type: "status";
  icon: ReactNode;
}

export interface BodyColumnRaw {
  label: string;
  type: "raw";
}

export interface BodyColumnZonedDateTime {
  label: string;
  type: "zoned-date-time";
  timestamp: string;
  options: {
    timezone?: string;
    dateFormat?: DateFormatString;
    locale?: string;
  };
}
export interface TableData {
  headColumns: string[];
  bodyColumns: Array<
    Array<
      | BodyColumnLink
      | BodyColumnStatus
      | BodyColumnRaw
      | BodyColumnZonedDateTime
    >
  >;
}

interface Props {
  title: string;
  viewAllHref: string;
  tableData: TableData;
}

export function Table({ title, viewAllHref, tableData }: Props) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl">{title}</h3>
        <Link
          to={viewAllHref}
          className="text-cslineargradient text-base !leading-5"
        >
          View All
        </Link>
      </div>
      <table
        className={`w-full text-left flex flex-col ${
          tableData.bodyColumns.length !== 0 ? "gap-2.5" : ""
        }`}
      >
        <thead className="flex w-full bg-cssurfacesinner">
          <tr className="flex w-full">
            {tableData.headColumns.map((col) => (
              <th key={col} className="p-4 w-full font-normal">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="w-full flex flex-col gap-1.5">
          {tableData.bodyColumns.length === 0 ? (
            <tr
              className={`w-full flex flex-col items-center gap-2.5 ${
                tableData.bodyColumns.length === 0
                  ? "py-5 border-b border-l border-r border-csinputcolorborder rounded rounded-tl-none rounded-tr-none"
                  : ""
              }`}
            >
              <td
                colSpan={tableData.bodyColumns.length}
                className="flex flex-col items-center gap-2.5"
              >
                <p className="text-xl">No runs yet</p>
                <span className="text-base text-csbodyandlabels">
                  When the jobs run, you&apos;ll see them here
                </span>
              </td>
            </tr>
          ) : (
            tableData.bodyColumns.map((col, index) => (
              <tr
                key={index}
                /* TODO: Get the right shadow for table row */
                className="flex w-full bg-[#FFFFFF0D] shadow-csbutton text-csbodyandlabels rounded border border-csbackdrop"
              >
                {col.map((row) => (
                  <td
                    key={row.label}
                    className="flex items-center h-full w-full p-4"
                  >
                    {mapRowTypeToTableRow(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
