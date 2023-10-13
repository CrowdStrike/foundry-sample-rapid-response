import FalconApi, {
  ApiResponsePayload,
  LocalData,
} from "@crowdstrike/foundry-js";

import {
  FileToInstall,
  putFilesGetSchema,
} from "@/lib/validations/api-validation";

interface IndividualRTRFilesArgs {
  falcon: FalconApi<LocalData>;
  fileName?: string;
}

/**
 * Get individual RTR files by fileName.
 * The aims of this function is to get the files that the user has already uploaded
 * and the files that he is actually using for a given job.
 */
export async function getIndividualRTRFiles({
  falcon,
  fileName,
}: IndividualRTRFilesArgs): Promise<ApiResponsePayload<FileToInstall>> {
  try {
    if (typeof fileName !== "string") {
      return { resources: [], errors: [] };
    }

    const fileId = await falcon.api.remoteResponse
      .getQueriesPutFilesV1({
        filter: `name:'${fileName}'`,
      })
      .catch(() => ({ resources: [], errors: [] }));

    const flattenFilesIds = fileId.resources as string[];
    if (flattenFilesIds.length > 0) {
      const files = await falcon.api.remoteResponse.getEntitiesPutFilesV2({
        ids: flattenFilesIds,
      });

      const safeFiles = putFilesGetSchema.parse(files);

      return safeFiles;
    }

    return { resources: [], errors: [] };
  } catch (err) {
    console.error("Error in getIndividualRTRFiles loader", err);
    if (err instanceof Error) {
      return { resources: [], errors: [{ message: err.message }] };
    }
    return { resources: [], errors: [] };
  }
}

/**
 * Get all the potential RTR files that have already been uploaded during previous
 * creation of Job.
 */
export async function getRTRFiles(
  falcon: FalconApi<LocalData>,
): Promise<ApiResponsePayload<FileToInstall>> {
  try {
    const filesIds = await falcon.api.remoteResponse.getQueriesPutFilesV1();

    if (Array.isArray(filesIds.resources) && filesIds.resources.length > 0) {
      const files = await falcon.api.remoteResponse.getEntitiesPutFilesV2({
        ids: filesIds.resources as string[],
      });
      const safeFiles = putFilesGetSchema.parse(files);

      return safeFiles;
    }

    return { resources: [], errors: [] };
  } catch (err) {
    console.error("Error in getRTRFiles loader", err);
    if (err instanceof Error) {
      return { resources: [], errors: [{ message: err.message }] };
    }
    return { resources: [], errors: [] };
  }
}
