interface Props {
  totalItems: number;
}

/**
 * A React Component toward the AuditLog page, to build the Header.
 */
export function Header({ totalItems }: Props) {
  return (
    <div className="py-6 px-8 bg-mezzanine">
      <div className="w-full flex justify-between items-center">
        <h1 className="flex gap-1 font-medium text-xl">
          Audit log (last 7 days)
          <span className="text-csbodyandlabels">{totalItems} items</span>
        </h1>
      </div>
    </div>
  );
}
