import { useLoaderData } from "react-router-dom";

import {
  FilesSchema,
  putFilesGetSchema,
} from "@/lib/validations/api-validation";

/**
 * Custom hook that is used to get the existing RTR files that have
 * been uploaded.
 * It won't perform any call to the back end but rather user the data already
 * loaded when loading the page.
 */
export function usePutFilesData(): FilesSchema {
  const data = useLoaderData();

  if (data !== null && typeof data === "object" && "files" in data) {
    const safeFiles = putFilesGetSchema.safeParse(data.files);
    if (safeFiles.success) {
      return { files: safeFiles.data.resources };
    }
  }

  return { files: [] };
}
