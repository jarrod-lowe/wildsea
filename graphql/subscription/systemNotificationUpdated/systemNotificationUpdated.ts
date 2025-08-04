import { util, Context } from "@aws-appsync/utils";

export function request() {
  // Return payload for local data source
  return { payload: {} };
}

export function response(context: Context): null {
  if (context.error) {
    util.error(context.error.message, context.error.type, context.result);
  }

  // No filtering needed for system notifications - all users should see them
  return null;
}
