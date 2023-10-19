import { useRouteLoaderData } from "react-router-dom";

import {
  UserData,
  simpleUserSchema,
  userSchema,
} from "@/lib/validations/api-validation";
import FalconApi, { LocalData } from "@crowdstrike/foundry-js";

interface Args {
  falcon: FalconApi<LocalData>;
}

/**
 * /!\ Only to use when dealing with NO React Components
 */
export function getUserData({ falcon }: Args) {
  const safeUserData = simpleUserSchema.safeParse(falcon.data?.user);

  if (!safeUserData.success) {
    return {
      user: { uuid: "0", username: "current.user@crowdstrike.com" },
    };
  }

  return { user: safeUserData.data };
}

/**
 * /!\ Only to use when dealing with React Components
 */
export function useUserData(): UserData {
  const userData = useRouteLoaderData("root");
  const safeUserData = userSchema.safeParse(userData);

  if (!safeUserData.success) {
    return {
      user: { uuid: "0", username: "current.user@crowdstrike.com" },
      users: [],
    };
  }

  return { user: safeUserData.data.user, users: safeUserData.data.users };
}
