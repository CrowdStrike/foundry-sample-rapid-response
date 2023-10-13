import { useRouteLoaderData } from "react-router-dom";

import { Host, HostGroup } from "@/lib/types";
import {
  HostsDataSchema,
  hostsDataSchema,
} from "@/lib/validations/api-validation";

interface HostsData {
  hostGroups: HostGroup[];
  hosts: Host[];
  hostGroupLookup: Record<string, string>;
  hostLookup: Record<string, string>;
}

function extractHostGroupInfo(data: HostsDataSchema): HostGroup[] {
  const { hostGroupsEntities, hostGroupsAggregates } = data;

  if (hostGroupsAggregates.length === 0) {
    return [];
  }

  const [first] = hostGroupsAggregates;

  return first.buckets
    .map(({ label, count }) => {
      const info = hostGroupsEntities.find((group) => group.id === label);
      if (info) {
        return { id: label, count, name: info.name };
      }
    })
    .filter((group): group is HostGroup => !!group);
}

export function useHostData(): HostsData {
  const hostsData = useRouteLoaderData("root");
  const safeHostsData = hostsDataSchema.safeParse(hostsData);

  if (!safeHostsData.success) {
    return {
      hosts: [],
      hostGroups: [],
      hostGroupLookup: {},
      hostLookup: {},
    };
  }

  const hostGroups = extractHostGroupInfo(safeHostsData.data);
  const hosts = safeHostsData.data.hostsEntities;

  const hostGroupLookup = hostGroups.reduce<Record<string, string>>(
    (map, hostGroup) => {
      return {
        ...map,
        [hostGroup.id]: `${hostGroup.name} (${hostGroup.count})`,
      };
    },
    {},
  );

  const hostLookup = hosts.reduce<Record<string, string>>((map, hostGroup) => {
    return {
      ...map,
      [hostGroup.device_id]: hostGroup.hostname,
    };
  }, {});

  return {
    hosts,
    hostGroups,
    hostGroupLookup,
    hostLookup,
  };
}
