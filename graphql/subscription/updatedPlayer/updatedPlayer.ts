import {
  TypeCharacter,
  TypeFirefly,
  TypeNPC,
} from "../../lib/constants/entityTypes";
import {
  ContextType,
  subscriptionRequest,
  subscriptionResponse,
} from "../../lib/gameSubscription";

export function request(context: ContextType) {
  return subscriptionRequest(context);
}

export function response(context: ContextType) {
  const objectTypes = [TypeCharacter, TypeFirefly, TypeNPC];
  return subscriptionResponse(context, objectTypes);
}
