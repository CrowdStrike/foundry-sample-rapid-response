const isStandalone = import.meta.env.MODE === "development";

const MOCK_BRIDGE_REQUESTED = import.meta.env["VITE_MOCK_BRIDGE_ENABLED"] as
  | "true"
  | "false";

export const ENABLE_MOCK_BRIDGE =
  isStandalone || MOCK_BRIDGE_REQUESTED === "true";

/**
 * Feature Flags to control the UI depending of various situations.
 */
export const UI_FLAGS = {
  enable_run_history_filtering: ENABLE_MOCK_BRIDGE,
  enable_sorting_tables: ENABLE_MOCK_BRIDGE,
};

export const DEFAULT_ITEMS_LIMIT = 10;

export const rapidResponseFunctions = {
  createJob: {
    path: "/upsert-job",
    name: "Func_Jobs",
  },
  getJobs: {
    path: "/jobs",
    name: "Func_Jobs",
  },
  getJobDetails: {
    path: "/job",
    name: "Func_Jobs",
  },
  getAuditLog: {
    path: "/audits",
    name: "Func_Jobs",
  },
  getRunHistory: {
    path: "/run-history",
    name: "job_history",
  },
};

// Mapping for function as a service (FaaS) functions
// To give them human-readable names.
export const FAAS = {
  createJob: rapidResponseFunctions.createJob,
  getJobs: rapidResponseFunctions.getJobs,
  getJobDetails: rapidResponseFunctions.getJobDetails,
  getAuditLog: rapidResponseFunctions.getAuditLog,
  getRunHistory: rapidResponseFunctions.getRunHistory,
};
