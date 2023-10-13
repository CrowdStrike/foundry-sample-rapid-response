import {
  MockDbSchema,
  historyLog01,
  auditLog01,
  jobRR01,
  jobRR02,
  jobRR03,
  jobRR04,
  jobRR05,
  jobRR06,
} from "@/mock/data/fixtures";
import {
  RTRPutFile01,
  RTRPutFile02,
  RTRPutFile03,
} from "@/mock/data/fixtures-files";

export const db: MockDbSchema = {
  jobs: [jobRR01, jobRR02, jobRR03, jobRR04, jobRR05, jobRR06],
  history: [historyLog01],
  logs: [auditLog01],
  rtrPutFiles: [RTRPutFile01, RTRPutFile02, RTRPutFile03],
};
