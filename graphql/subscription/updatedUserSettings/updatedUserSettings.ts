import {
  util,
  Context,
  extensions,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import { TypeSettings } from "../../lib/constants/entityTypes";

export function request(context: Context) {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  // Return payload for local data source
  return { payload: {} };
}

export function response(context: Context): null {
  if (!context.identity) util.unauthorized();
  const identity = context.identity as AppSyncIdentityCognito;
  if (!identity?.sub) util.unauthorized();

  // Filter to only this user's settings updates
  const filter = {
    userId: { eq: identity.sub },
    type: { eq: TypeSettings },
  };
  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter));

  return null;
}
