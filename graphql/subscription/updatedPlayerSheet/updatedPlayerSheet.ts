import { TypeCharacter, TypeFirefly } from "../../lib/constants";
import {
  ContextType,
  subscriptionRequest,
  subscriptionResponse,
} from "../../lib/gameSubscription";

export function request(context: ContextType) {
  return subscriptionRequest(context);
}

export function response(context: ContextType) {
  const objectTypes = [TypeCharacter, TypeFirefly];
  return subscriptionResponse(context, objectTypes);
}
