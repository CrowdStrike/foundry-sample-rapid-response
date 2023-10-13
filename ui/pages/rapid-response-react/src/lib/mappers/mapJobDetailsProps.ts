import { Host, HostGroup } from "@/lib/types";
import { Job } from "@/lib/validations/api-validation";
import { mapHostsIdToName } from "@/lib/mappers/mapHostNames";

interface DisplayStruct {
  value: string;
  label: string;
  name: string;
}

export function mapJobDetailsPropsToDisplay(
  job: Job,
  hosts: Host[],
  hostGroups: HostGroup[],
): DisplayStruct[] {
  const displayer: DisplayStruct[] = [];
  const mappedHosts = mapHostsIdToName(job, hosts, hostGroups);

  const jobType = {
    value: job.action.type === "installSoftware" ? "Install" : "Remove",
    label: "Job type",
    name: "jobType",
  };

  if (job.action.type === "removeFile") {
    displayer.push({
      value: job.action.remove_file_name,
      label: "File name",
      name: "fileName",
    });
  }

  if (
    job.action.type === "removeFile" &&
    typeof job.action.remove_file_path === "string" &&
    job.action.remove_file_path.length > 0
  ) {
    displayer.push({
      value: job.action.remove_file_path,
      label: "File path",
      name: "filePath",
    });
  }

  if (
    job.action.type === "installSoftware" &&
    typeof job.action.command_switch === "string" &&
    job.action.command_switch.length > 0
  ) {
    displayer.push({
      value: job.action.command_switch,
      label: "Command switch",
      name: "cmdSwitch",
    });
  }

  if (Array.isArray(job.target.hosts) && job.target.hosts.length > 0) {
    displayer.push({
      value: mappedHosts.join(", "),
      label: "Host(s)",
      name: "hosts",
    });
  } else if (
    Array.isArray(job.target.host_groups) &&
    job.target.host_groups.length > 0
  ) {
    displayer.push({
      value: mappedHosts.join(", "),
      label: "Host group(s)",
      name: "hostGroups",
    });
  }

  const runOn = {
    value: job.target.offline_queueing
      ? "online and queue for offline hosts"
      : "online hosts only",
    label: "Run on",
    name: "isOfflineQueueing",
  };

  return [jobType, ...displayer, runOn];
}

export function mapSchedulePropsToDisplay(job: Job): DisplayStruct[] {
  const toDisplay: DisplayStruct[] = [];

  if (job.schedule?.start_date) {
    toDisplay.push({
      label: "Run date",
      value: job.schedule.start_date,
      name: "runDate",
    });
  }

  return toDisplay;
}

export function mapPeoplePropsToDisplay(job: Job): DisplayStruct[] {
  const people: DisplayStruct[] = [];

  people.push({ label: "Creator", value: job.user_name, name: "creator" });

  const watchers =
    job.notifications?.map((watcher) => ({
      label: "Watcher",
      value: watcher,
      name: "creator",
    })) ?? [];
  people.push(...watchers);

  return people;
}
