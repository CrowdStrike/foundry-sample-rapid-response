import { LoaderFunctionArgs } from "react-router-dom";
import FalconApi, { LocalData } from "@crowdstrike/foundry-js";

/**
 * React Router Loader typing
 */
interface LoaderParams {
  falcon: FalconApi<LocalData>;
}

export type Loader<T = unknown> = (
  opts: LoaderParams,
) => (args: LoaderFunctionArgs) => Promise<T>;

/**
 * Users typing
 */
export type User = {
  uuid: string;
  cid: string;
  uid: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

/**
 * Hosts typing
 */
export type Host = {
  device_id: string;
  hostname: string;
};

export type HostGroup = {
  count: number;
  id: string;
  name: string;
};
