// mutation/createGame/appsync.ts
import { util } from "@aws-appsync/utils";
function request(context) {
  if (!context.identity) {
    util.error("Unauthorized: Identity information is missing.");
  }
  const identity = context.identity;
  if (!identity.sub) {
    util.error("Unauthorized: User ID is missing.");
  }
  const input = context.arguments.input;
  const id = util.autoId();
  const timestamp = util.time.nowISO8601();
  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ PK: "GAME#" + id, SK: "GAME" }),
    attributeValues: util.dynamodb.toMapValues({
      name: input.name,
      description: input.description,
      id,
      fireflyUserId: identity.sub,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  };
}
function response(context) {
  if (context.error) {
    util.appendError(context.error.message, context.error.type, context.result);
    return;
  }
  return context.result;
}
export {
  request,
  response
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBwc3luYy50cyJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLFlBQStGO0FBY2pHLFNBQVMsUUFBUSxTQUFzRTtBQUMxRixNQUFJLENBQUMsUUFBUSxVQUFVO0FBQ25CLFNBQUssTUFBTSxnREFBMEQ7QUFBQSxFQUN6RTtBQUVBLFFBQU0sV0FBVyxRQUFRO0FBQ3pCLE1BQUksQ0FBQyxTQUFTLEtBQUs7QUFDZixTQUFLLE1BQU0sbUNBQTZDO0FBQUEsRUFDNUQ7QUFFQSxRQUFNLFFBQVEsUUFBUSxVQUFVO0FBQ2hDLFFBQU0sS0FBSyxLQUFLLE9BQU87QUFDdkIsUUFBTSxZQUFZLEtBQUssS0FBSyxXQUFXO0FBQ3ZDLFNBQU87QUFBQSxJQUNILFdBQVc7QUFBQSxJQUNYLEtBQUssS0FBSyxTQUFTLFlBQVksRUFBRSxJQUFJLFVBQVEsSUFBSSxJQUFJLE9BQU8sQ0FBQztBQUFBLElBQzdELGlCQUFpQixLQUFLLFNBQVMsWUFBWTtBQUFBLE1BQ3ZDLE1BQU0sTUFBTTtBQUFBLE1BQ1osYUFBYSxNQUFNO0FBQUEsTUFDbkI7QUFBQSxNQUNBLGVBQWUsU0FBUztBQUFBLE1BQ3hCLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQSxJQUNmLENBQUM7QUFBQSxFQUNMO0FBQ0o7QUFFTyxTQUFTLFNBQVMsU0FBMkI7QUFDaEQsTUFBSSxRQUFRLE9BQU87QUFDZixTQUFLLFlBQVksUUFBUSxNQUFNLFNBQVMsUUFBUSxNQUFNLE1BQU0sUUFBUSxNQUFNO0FBQzFFO0FBQUEsRUFDSjtBQUNBLFNBQU8sUUFBUTtBQUNuQjsiLAogICJuYW1lcyI6IFtdCn0K
