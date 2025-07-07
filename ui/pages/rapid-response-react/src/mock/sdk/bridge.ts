import {
  Bridge,
  RemoteResponseApiRequestMessage,
  RequestMessage,
} from "@crowdstrike/foundry-js";

import { DevicesApiMock } from "@/mock/api/devices";
import { UsersApiMock } from "@/mock/api/users";
import { db as emptyScenario } from "@/mock/data/empty";
import { db as populatedScenario } from "@/mock/data/populated";
import { MockDbSchema } from "@/mock/data/fixtures";
import { MockFaasHandler } from "@/mock/faas/base";
import { CreateJobHandler } from "@/mock/faas/create-job";
import { GetAuditLogHandler } from "@/mock/faas/get-audit-logs";
import { GetEntitiesPutFilesV2Handler } from "@/mock/faas/get-entities-put-files-v2";
import { GetJobDetailsHandler } from "@/mock/faas/get-job-details";
import { GetJobsHandler } from "@/mock/faas/get-jobs";
import { GetQueriesPutFilesV1Handler } from "@/mock/faas/get-queries-put-files-v1";
import { GetRunHistoryHandler } from "@/mock/faas/get-run-history";
import { isConnectMessage } from "@/mock/sdk/predicates";

export { emptyScenario, populatedScenario };

// `vite` runs a server for rapid development
// `vite build` compiles the app and writes it to the dist/ directory
const isStandalone = import.meta.env.MODE === "development";

export type ConstructorArgs = {
  db: MockDbSchema;
  appName: "rapid-response" | "scalable-rtr";
};

export class MockBridge extends Bridge {
  createJob: MockFaasHandler;
  getJobs: MockFaasHandler;
  getJobDetails: MockFaasHandler;
  getAuditLog: MockFaasHandler;
  getRunHistory: MockFaasHandler;
  getQueriesPutFilesV1: GetQueriesPutFilesV1Handler;
  getEntitiesPutFilesV2: GetEntitiesPutFilesV2Handler;
  devices: DevicesApiMock;
  userManagement: UsersApiMock;
  db: MockDbSchema;

  constructor(
    { db, appName }: ConstructorArgs = {
      db: emptyScenario,
      appName: "rapid-response",
    },
  ) {
    super();
    this.db = db;
    this.createJob = new CreateJobHandler({ db: this.db, appName });
    this.getJobs = new GetJobsHandler({ db: this.db, appName });
    this.getJobDetails = new GetJobDetailsHandler({ db: this.db, appName });
    this.getAuditLog = new GetAuditLogHandler({ db: this.db, appName });
    this.getRunHistory = new GetRunHistoryHandler({ db: this.db, appName });
    this.getQueriesPutFilesV1 = new GetQueriesPutFilesV1Handler({
      db: this.db,
    });
    this.getEntitiesPutFilesV2 = new GetEntitiesPutFilesV2Handler({
      db: this.db,
    });
    this.devices = new DevicesApiMock();
    this.userManagement = new UsersApiMock();
  }

  async postMessage<
    REQ extends RequestMessage | RemoteResponseApiRequestMessage,
    ResolvedValue = void
  >(message: REQ): Promise<ResolvedValue> {
    let value: any;

    if (isStandalone && isConnectMessage(message)) {
      const { origin } = window.location;
      value = {
        origin,
        data: {
          theme: "theme-dark",
          locale: "en-us",
          dateFormat: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
    } else if (this.devices.isMatch(message)) {
      value = await this.devices.responder(message);
    } else if (this.userManagement.isMatch(message)) {
      value = await this.userManagement.responder(message);
    } else if (this.getJobs.isMatch(message)) {
      value = await this.getJobs.responder(message);
    } else if (this.createJob.isMatch(message)) {
      value = await this.createJob.responder(message);
    } else if (this.getJobDetails.isMatch(message)) {
      value = await this.getJobDetails.responder(message);
    } else if (this.getAuditLog.isMatch(message)) {
      value = await this.getAuditLog.responder(message);
    } else if (this.getRunHistory.isMatch(message)) {
      value = await this.getRunHistory.responder(message);
    } else if (this.getQueriesPutFilesV1.isMatch(message)) {
      value = await this.getQueriesPutFilesV1.responder(message);
    } else if (this.getEntitiesPutFilesV2.isMatch(message)) {
      value = await this.getEntitiesPutFilesV2.responder(message);
    } else if (isStandalone) {
      console.log("No handler for message:", { message });
      value = await Promise.resolve({});
    } else {
      value = await super.postMessage(message);
    }
    if (!value) {
      throw new Error("Woops!");
    }
    console.log("MockBridge#postMessage: ", { message, value });
    return value as ResolvedValue;
  }
}
