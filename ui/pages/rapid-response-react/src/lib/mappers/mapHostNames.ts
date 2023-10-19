import { Host, HostGroup } from "@/lib/types";
import { Job } from "@/lib/validations/api-validation";

export function mapHostsIdToName(
  job: Job,
  hosts: Host[],
  hostGroups: HostGroup[],
): string[] {
  if (job.target.hosts && job.target.hosts.length > 0) {
    return hosts
      .filter((host) => job.target.hosts?.includes(host.device_id))
      .map((host) => host.hostname);
  } else if (job.target.host_groups && job.target.host_groups.length > 0) {
    return hostGroups
      .filter((hostGroup) => job.target.host_groups?.includes(hostGroup.id))
      .map((hostGroup) => `${hostGroup.name} (${hostGroup.count})`);
  }
  return [];
}
