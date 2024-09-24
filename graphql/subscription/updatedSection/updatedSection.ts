import { TypeSection } from "../../lib/constants";
import {
  ContextType,
  subscriptionRequest,
  subscriptionResponse,
} from "../../lib/gameSubscription";

export function request(context: ContextType) {
  return subscriptionRequest(context);
}

export function response(context: ContextType) {
  const objectTypes = [TypeSection];
  return subscriptionResponse(context, objectTypes);
}
