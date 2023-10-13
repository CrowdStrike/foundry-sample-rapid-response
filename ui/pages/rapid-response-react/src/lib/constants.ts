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

const rapidResponseVersion = 33;

export const rapidResponseFunctions = {
  createJob: {
    version: rapidResponseVersion,
    path: "/upsert-job",
    id: "73981962796842dbbc2c36eef7b8004b",
    name: "Func_Jobs",
  },
  getJobs: {
    version: rapidResponseVersion,
    path: "/jobs",
    id: "73981962796842dbbc2c36eef7b8004b",
    name: "Func_Jobs",
  },
  getJobDetails: {
    version: rapidResponseVersion,
    path: "/job",
    id: "73981962796842dbbc2c36eef7b8004b",
    name: "Func_Jobs",
  },
  getAuditLog: {
    version: rapidResponseVersion,
    path: "/audits",
    id: "73981962796842dbbc2c36eef7b8004b",
    name: "Func_Jobs",
  },
  getRunHistory: {
    version: 27,
    path: "/run-history",
    id: "37fd956f9cc2449e8455e43797a555eb",
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
