import { Link } from "react-router-dom";

import {
  BodyColumnLink,
  BodyColumnRaw,
  BodyColumnStatus,
  BodyColumnZonedDateTime,
} from "@/components/table-details/Table";
import { ZonedDateTime } from "@/components/ZonedDateTime";

interface StatusRowProps {
  row: BodyColumnStatus;
}

function StatusRow({ row }: StatusRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      {row.icon}
      {row.label}
    </div>
  );
}

interface LinkRowProps {
  row: BodyColumnLink;
}

function LinkRow({ row }: LinkRowProps) {
  return (
    <Link to={row.href} className="text-csteal underline">
      {row.label}
    </Link>
  );
}

function mapRowTypeToTableRow(
  row:
    | BodyColumnLink
    | BodyColumnStatus
    | BodyColumnRaw
    | BodyColumnZonedDateTime,
) {
  switch (row.type) {
    case "status":
      return <StatusRow row={row} />;
    case "link":
      return <LinkRow row={row} />;
    case "zoned-date-time":
      return <ZonedDateTime timestamp={row.timestamp} options={row.options} />;
    default:
      return row.label;
  }
}

export default mapRowTypeToTableRow;
