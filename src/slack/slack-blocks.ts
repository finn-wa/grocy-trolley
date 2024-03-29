import { Logger, prettyPrint } from "@gt/utils/logger";
import { ActionsBlock, SectionBlock, SlackActionMiddlewareArgs } from "@slack/bolt";

export function textSection(text: string): SectionBlock {
  return {
    type: "section",
    text: { text, type: "plain_text", emoji: true },
  };
}

export function markdownSection(text: string): SectionBlock {
  return {
    type: "section",
    text: { text, type: "mrkdwn" },
  };
}

export function confirmButtons(actionId: string): ActionsBlock {
  return {
    type: "actions",
    block_id: `${actionId}:confirm`,
    elements: [
      {
        type: "button",
        text: { text: "Cancel", type: "plain_text", emoji: false },
        value: "false",
        action_id: `${actionId}:cancel`,
      },
      {
        type: "button",
        text: { text: "Confirm", type: "plain_text", emoji: false },
        style: "primary",
        value: "true",
        action_id: `${actionId}:confirm`,
      },
    ],
  };
}

/**
 * Returns markdown text styled to look somewhat like the confirm buttons, with one selected.
 * @param actionId action ID for button clicked by user
 * @returns markdown section
 */
export function updatedConfirmButtons(actionId: string): SectionBlock {
  return markdownSection(
    actionId.endsWith(":cancel") ? "[ *Cancel* ] [ ~Confirm~ ]" : "[ ~Cancel~ ] [ *Confirm* ]"
  );
}

export function hasPayloadType<T extends SlackActionMiddlewareArgs["payload"]>(
  payload: SlackActionMiddlewareArgs["payload"],
  payloadType: T["type"]
): payload is T {
  if (payload.type !== payloadType) {
    new Logger("HasPayloadType").debug(
      `Expected payload of type ${payload.type}, received: ${prettyPrint(payload)}`
    );
    return false;
  }
  return true;
}
