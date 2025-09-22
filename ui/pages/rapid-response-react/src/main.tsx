import { LazyMotion, domAnimation } from "framer-motion";
import React, { useReducer, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import FalconApi from "@crowdstrike/foundry-js";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

import Layout from "@/components/Layout.tsx";
import AllJobs, { loader as allJobsLoader } from "@/pages/AllJobs.tsx";
import AuditLog, { loader as auditLogLoader } from "@/pages/AuditLog.tsx";
import CreateJob, { loader as createJobLoader } from "@/pages/CreateJob.tsx";
import EditJob, { loader as editJobLoader } from "@/pages/EditJob.tsx";
import JobDetails, { loader as jobDetailsLoader } from "@/pages/JobDetails.tsx";
import RunHistory, { loader as runHistoryLoader } from "@/pages/RunHistory.tsx";

import { ENABLE_MOCK_BRIDGE } from "@/lib/constants.ts";
import {
  CreateJobContext,
  defaultState,
  getCurrentStep,
  getStepStatus,
  goBack,
  goNext,
  reducer,
} from "@/lib/contexts/CreateJobContext.ts";
import { FalconContext } from "@/lib/contexts/FalconContext/FalconContext.ts";
import createJob from "@/lib/contexts/FalconContext/create-job.ts";

import "@/assets/common.css";
import "@/assets/shoelace-toucan-theme.css";
import { getHostGroups } from "@/lib/loaders/host-groups.ts";
import { getHosts } from "@/lib/loaders/hosts.ts";
import { getUsers } from "@/lib/loaders/users.ts";
import { Loader } from "@/lib/types.ts";
import { defaultFormat, isValidDateFormat } from "@/lib/utils/datetime.ts";
import { CreateJobError } from "@/lib/validations/api-validation.ts";

setBasePath("https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.5.2/cdn/");

interface Props {
  children: React.ReactNode;
}

const homeLoader: Loader = ({ falcon }) => {
  return async () => {
    const [hostGroups, hosts, users] = await Promise.all([
      getHostGroups(falcon),
      getHosts(falcon),
      getUsers(falcon),
    ]);

    return {
      /** Handle Hosts */
      hostGroupsEntities: hostGroups.entities.resources,
      hostGroupsAggregates: hostGroups.aggregates.resources,
      hostsEntities: hosts.entities.resources,
      /** Handle Users */
      user: !ENABLE_MOCK_BRIDGE
        ? falcon.data?.user ?? {
            uuid: "0",
            username: "current.user@crowdstrike.com",
          }
        : { uuid: "0", username: "current.user@crowdstrike.com" },
      users,
    };
  };
};

(async () => {
  const falcon = new FalconApi();
  if (ENABLE_MOCK_BRIDGE) {
    // Dynamically importing MockBridge and scenarios ensures
    // that we don't ship mock data to production.
    const { MockBridge, populatedScenario } = await import("@/mock/sdk/bridge");
    (falcon.bridge as unknown) = new MockBridge({
      db: populatedScenario,
      appName: "rapid-response",
    });
  }

  await falcon.connect();

  function CreateJobProvider({ children }: Props) {
    const [state, dispatch] = useReducer(reducer, defaultState);

    return (
      <CreateJobContext.Provider
        value={{
          state,
          dispatch,
          getStepStatus: getStepStatus(state),
          goBack: goBack(state, dispatch),
          goNext: goNext(state, dispatch),
          currentStep: getCurrentStep(state),
        }}
      >
        {children}
      </CreateJobContext.Provider>
    );
  }

  function FalconProvider({ children }: Props) {
    const [isLoading, setLoadingState] = useState(false);
    const [errors, setErrors] = useState<CreateJobError[]>([]);
    const timezone = falcon?.data?.timezone ?? "UTC";
    const locale = falcon?.data?.locale ?? "en-us";

    const onResetErrors = () => {
      if (errors.length > 0) {
        setErrors([]);
      }
    };

    const dateFormat =
      falcon?.data?.dateFormat && isValidDateFormat(falcon.data.dateFormat)
        ? falcon.data.dateFormat
        : defaultFormat;

    return (
      <FalconContext.Provider
        value={{
          falcon,
          isLoading,
          setLoadingState,
          setErrors,
          resetErrors: onResetErrors,
          createJob: createJob(falcon),
          errors,
          timezone,
          locale,
          dateFormat,
        }}
      >
        {children}
      </FalconContext.Provider>
    );
  }

  const app = (
    <Route
      id="root"
      path="/"
      element={<Layout />}
      loader={homeLoader({ falcon })}
    >
      <Route index element={<Navigate to="/all-jobs" replace />} />
      <Route
        path="/all-jobs"
        id="allJobs"
        element={<AllJobs />}
        loader={allJobsLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="/create-job"
        element={
          <CreateJobProvider>
            <CreateJob />
          </CreateJobProvider>
        }
        loader={createJobLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="/job/:id"
        element={<JobDetails />}
        loader={jobDetailsLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="/job/:id/edit"
        element={
          <CreateJobProvider>
            <EditJob />
          </CreateJobProvider>
        }
        loader={editJobLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="/run-history"
        element={<RunHistory />}
        loader={runHistoryLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="/audit-log"
        element={<AuditLog />}
        loader={auditLogLoader({ falcon })}
        errorElement={<ErrorBoundary />}
      />
      <Route
        path="*"
        element={<ErrorBoundary is404Error />}
        errorElement={<ErrorBoundary />}
      />
    </Route>
  );

  const routes = createRoutesFromElements(app);
  const router = createHashRouter(routes);

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <LazyMotion features={domAnimation} strict>
        <FalconProvider>
          <RouterProvider router={router} />
        </FalconProvider>
      </LazyMotion>
    </React.StrictMode>,
  );
})().catch(console.error);
