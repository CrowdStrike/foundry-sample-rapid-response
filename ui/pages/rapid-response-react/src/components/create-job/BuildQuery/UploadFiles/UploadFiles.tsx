import { ChangeEvent, useState } from "react";

import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";

interface Props {
  onUploadFile: (evt: ChangeEvent<HTMLInputElement>) => void;
}

function UploadFiles({ onUploadFile }: Props) {
  const [isDraggingFileOverZone, setDragging] = useState(false);

  const onDragOver = () => {
    if (!isDraggingFileOverZone) {
      setDragging(true);
    }
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  return (
    <div
      className={`relative flex h-96 w-full cursor-pointer items-center justify-center rounded-sm border ${
        isDraggingFileOverZone
          ? "border-white bg-csdetailsbg"
          : "border-neutral-800 bg-[#00000021]"
      } border-dashed hover:bg-csdetailsbg`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDragLeave}
    >
      <p className="flex items-center gap-1.5">
        {isDraggingFileOverZone ? (
          <div className="flex flex-col items-center gap-5">
            <span className="text-csteal">Drop your files here!</span>
            <SlIcon name="upload" style={{ fontSize: "22px" }} />
          </div>
        ) : (
          <>
            Drag files here, or{" "}
            <span className="text-csteal">upload files</span>
            <SlIcon name="upload" style={{ fontSize: "16px" }} />
          </>
        )}
      </p>
      <input
        type="file"
        id="file"
        multiple
        onChange={onUploadFile}
        className="absolute left-0 top-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

export default UploadFiles;
