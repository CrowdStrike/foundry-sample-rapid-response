import { AuditLogType } from "@/mock/schemas/audit-log-schemas";
import { RunHistoryType } from "@/mock/schemas/run-history-schemas";
import { RRJobType } from "@/mock/schemas/rr-schemas";
import { Job } from "@/mock/schemas/schemas";
import { RTRPutFilesType } from "@/mock/schemas/rtr-put-files";
import { RTRPutFile01 } from "@/mock/data/fixtures-files";

export const hostGroupsEntities = [
  {
    id: "abc123",
    name: "Mitre hosts",
  },
  {
    id: "def456",
    name: "RTR hosts",
  },
  {
    id: "ghi789",
    name: "Response hosts",
  },
];

export const hostGroupsAggregates = [
  {
    name: "groups",
    buckets: [
      {
        label: "abc123",
        count: 42,
      },
      {
        label: "def456",
        count: 23,
      },
    ],
  },
];

export const hostsEntities = [
  {
    device_id: "xyz987",
    hostname: "Odysseus",
  },
  {
    device_id: "mno654",
    hostname: "Agamemnon",
  },
  {
    device_id: "pqr321",
    hostname: "Achilles",
  },
];

export const usersEntities = [
  {
    uuid: "uuid1",
    cid: "cid",
    uid: "f.bird@crowdstrike.com",
    first_name: "Falcon",
    last_name: "Bird",
    created_at: "2023-09-12T14:35:46Z",
  },
  {
    uuid: "uuid2",
    cid: "cid",
    uid: "p.bird@crowdstrike.com",
    first_name: "Peregrine",
    last_name: "Bird",
    created_at: "2023-09-12T14:35:46Z",
  },
  {
    uuid: "uuid3",
    cid: "cid",
    uid: "r.dino@crowdstrike.com",
    first_name: "Raptor",
    last_name: "Dino",
    created_at: "2023-09-12T14:35:46Z",
  },
];

export const jobRR01: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "1",
  name: "First Job RR",
  description: "First Job RR description",
  notification_emails: null,
  notifications: ["paul.rosset@crowdstrike.com"],
  draft: true,
  tags: null,
  host_count: hostsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "installSoftware",
    install_file_path: "hello",
    command_switch: "world",
    file_name: RTRPutFile01.name,
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: null,
    hosts: hostsEntities.map((host) => host.device_id),
    offline_queueing: false,
  },
  run_now: false,
  next_run: "2023-09-02T08:25:17.179Z",
  last_run: "2023-09-02T08:25:17.179Z",
  created_at: "2023-09-02T08:25:17.179Z",
  updated_at: "2023-09-02T08:25:17.179Z",
  deleted_at: "2023-09-02T08:25:17.179Z",
};

export const jobRR02: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "2",
  name: "Second Job Test RR",
  description: "Second Job Test RR",
  notification_emails: null,
  notifications: null,
  draft: false,
  tags: null,
  host_count: hostGroupsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "removeFile",
    remove_file_name: "hello",
    remove_file_path: "world",
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: hostGroupsEntities.map((host) => host.id),
    hosts: null,
    offline_queueing: true,
  },
  run_now: true,
  next_run: "2023-08-31T08:25:17.179Z",
  last_run: "2023-08-31T08:25:17.179Z",
  created_at: "2023-08-31T08:25:17.179Z",
  updated_at: "2023-08-31T08:25:17.179Z",
  deleted_at: "2023-08-31T08:25:17.179Z",
};

export const jobRR03: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "3",
  name: "Third Job Test RR",
  description: "Third Job Test RR",
  notification_emails: null,
  notifications: null,
  draft: false,
  tags: null,
  host_count: hostGroupsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "removeFile",
    remove_file_name: "hello",
    remove_file_path: "world",
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: hostGroupsEntities.map((host) => host.id),
    hosts: null,
    offline_queueing: true,
  },
  run_now: true,
  next_run: "2023-08-31T08:25:17.179Z",
  last_run: "2023-08-31T08:25:17.179Z",
  created_at: "2023-08-31T08:25:17.179Z",
  updated_at: "2023-08-31T08:25:17.179Z",
  deleted_at: "2023-08-31T08:25:17.179Z",
};

export const jobRR04: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "4",
  name: "Fourth Job Test RR",
  description: "Fourth Job Test RR",
  notification_emails: null,
  notifications: null,
  draft: false,
  tags: null,
  host_count: hostGroupsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "removeFile",
    remove_file_name: "hello",
    remove_file_path: "world",
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: hostGroupsEntities.map((host) => host.id),
    hosts: null,
    offline_queueing: true,
  },
  run_now: true,
  next_run: "2023-08-31T08:25:17.179Z",
  last_run: "2023-08-31T08:25:17.179Z",
  created_at: "2023-08-31T08:25:17.179Z",
  updated_at: "2023-08-31T08:25:17.179Z",
  deleted_at: "2023-08-31T08:25:17.179Z",
};

export const jobRR05: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "5",
  name: "Fifth Job Test RR",
  description: "",
  notification_emails: null,
  notifications: null,
  draft: false,
  tags: null,
  host_count: hostGroupsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "removeFile",
    remove_file_name: "hello",
    remove_file_path: "world",
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: hostGroupsEntities.map((host) => host.id),
    hosts: null,
    offline_queueing: true,
  },
  run_now: true,
  next_run: "2023-08-31T08:25:17.179Z",
  last_run: "2023-08-31T08:25:17.179Z",
  created_at: "2023-08-31T08:25:17.179Z",
  updated_at: "2023-08-31T08:25:17.179Z",
  deleted_at: "2023-08-31T08:25:17.179Z",
};

export const jobRR06: RRJobType = {
  user_id: "dummy",
  user_name: "dummy",
  version: 0,
  id: "6",
  name: "Sixth Job Test RR",
  description: "Sixth Job Test RR",
  notification_emails: null,
  notifications: null,
  draft: false,
  tags: null,
  host_count: hostGroupsEntities.length,
  run_count: 0,
  total_recurrences: 0,
  action: {
    type: "removeFile",
    remove_file_name: "hello",
    remove_file_path: "world",
  },
  schedule: {
    start_date: "2023-08-31T08:25:17.179Z",
  },
  target: {
    host_groups: hostGroupsEntities.map((host) => host.id),
    hosts: null,
    offline_queueing: true,
  },
  run_now: true,
  next_run: "2023-08-31T08:25:17.179Z",
  last_run: "2023-08-31T08:25:17.179Z",
  created_at: "2023-08-31T08:25:17.179Z",
  updated_at: "2023-08-31T08:25:17.179Z",
  deleted_at: "2023-08-31T08:25:17.179Z",
};

export type MockDbSchema = {
  jobs: Job[];
  history: RunHistoryType[];
  logs: AuditLogType[];
  rtrPutFiles: RTRPutFilesType[];
};

export const historyLog01: RunHistoryType = {
  id: "1",
  job_id: "1",
  execution_id: "1",
  name: "First Job RR",
  run_date: "2023-08-11 09:35:29",
  duration: "00:12:21",
  status: "completed",
  hosts: ["host1"],
  numHosts: 1,
  receivedFiles: 2,
  endDate: "2023-08-09 13:42:34",
};

export const historyLog02: RunHistoryType = {
  id: "2",
  job_id: "2",
  execution_id: "2",
  name: "CVE-2023-123457",
  run_date: "2023-08-08 13:42:34",
  duration: "00:02:47",
  status: "completed",
  hosts: ["host1", "host2"],
  numHosts: 2,
  receivedFiles: 2,
  endDate: "2023-08-09 13:42:34",
};

export const auditLog01: AuditLogType = {
  id: "1",
  job_id: "1",
  job_name: "CVE-2023-123456",
  modified_at: "2023-08-11 09:35:29",
  version: 1,
  modified_by: "g.thegrey@crowdstrike.com",
  action: "Created JobRTR",
};

export const auditLog02: AuditLogType = {
  id: "2",
  job_id: "2",
  job_name: "CVE-2023-123457",
  modified_at: "2023-08-11 09:35:29",
  version: 1,
  modified_by: "a.elessar@crowdstrike.com",
  action: "Created JobRTR",
};
