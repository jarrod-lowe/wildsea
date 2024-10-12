import { AppSyncIdentityIAM, Identity } from "@aws-appsync/utils";

export function authIsIam(identity: Identity): boolean {
  if (!identity) {
    return false;
  }

  const hasAccountId = (identity as AppSyncIdentityIAM).accountId !== undefined;
  const hasUserArn = (identity as AppSyncIdentityIAM).userArn !== undefined;
  const result = hasAccountId && hasUserArn;
  return result;
}
