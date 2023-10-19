import { LoaderSmall } from "@/components/LoaderSmall";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

interface Props {
  fileName: string;
  fileSize?: string;
  onDelete?: () => void;
  isLoading?: boolean;
}

function UploadedFile({
  fileName,
  fileSize,
  onDelete,
  isLoading = false,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-sm bg-csdetailsbg px-4 py-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm">{fileName}</span>
        {typeof fileSize === "string" ? (
          <span className="text-xs">{fileSize}</span>
        ) : null}
      </div>
      {typeof onDelete === "function" ? (
        <button type="button" onClick={onDelete} className="cursor-pointer">
          {isLoading ? <LoaderSmall /> : <SlIcon name="trash" />}
        </button>
      ) : null}
    </div>
  );
}

export default UploadedFile;
