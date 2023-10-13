import FalconApi, { LocalData } from "@crowdstrike/foundry-js";
import { createContext } from "react";

import {
  CreateJobError,
  CreateJobResponse,
} from "@/lib/validations/api-validation";
import createJob, {
  CreateJobArgs,
} from "@/lib/contexts/FalconContext/create-job";
import { DateFormatString, defaultFormat } from "@/lib/utils/datetime";

interface FalconContext {
  falcon: FalconApi<LocalData>;
  isLoading: boolean;
  setLoadingState: (loadingState: boolean) => void;
  createJob: (args: CreateJobArgs) => Promise<CreateJobResponse>;
  errors: CreateJobError[];
  setErrors: (error: CreateJobError[]) => void;
  resetErrors: () => void;
  timezone: string;
  locale: string;
  dateFormat: DateFormatString;
}

export const FalconContext = createContext<FalconContext>({
  falcon: null!,
  createJob: createJob(null!),
  isLoading: false,
  setLoadingState: null!,
  errors: [],
  setErrors: null!,
  resetErrors: null!,
  timezone: "UTC",
  locale: "en-us",
  dateFormat: defaultFormat,
});
