import {
  ApiRequestMessage,
  ConnectRequestMessage,
  DevicesApiRequestMessage,
  FaasGatewayApiRequestMessage,
  RequestMessage,
  UserManagementApiRequestMessage,
  WorkflowsApiRequestMessage,
  RemoteResponseApiRequestMessage,
} from "@crowdstrike/foundry-js";

export function isConnectMessage(
  message: RequestMessage,
): message is ConnectRequestMessage {
  return message.type === "connect";
}

export function isApiRequestMessage(
  message: RequestMessage,
): message is ApiRequestMessage {
  return message.type === "api";
}

export function isWorkflowsApiRequest(
  message: RequestMessage,
): message is WorkflowsApiRequestMessage {
  return isApiRequestMessage(message) && message.api === "workflows";
}

export function isFaasGatewayApiRequest(
  message: RequestMessage,
): message is FaasGatewayApiRequestMessage {
  return isApiRequestMessage(message) && message.api === "faasGateway";
}

export function isDevicesApiRequest(
  message: RequestMessage,
): message is DevicesApiRequestMessage {
  return isApiRequestMessage(message) && message.api === "devices";
}

export function isUsersApiRequest(
  message: RequestMessage,
): message is UserManagementApiRequestMessage {
  return isApiRequestMessage(message) && message.api === "userManagement";
}

export function isRemoteResponseApiRequest(
  message: RequestMessage,
): message is RemoteResponseApiRequestMessage {
  return isApiRequestMessage(message) && message.api === "remoteResponse";
}
