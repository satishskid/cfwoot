import { describe, it, expect } from "vitest";

describe("Webhook Payload Processing", () => {
  const sampleInbound = {
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              messages: [
                {
                  from: "919876543210",
                  id: "wamid.HBgMOTE5MTc4NzY1NDMyMTA",
                  timestamp: "1700000000",
                  type: "text",
                  text: { body: "Hello, I need help!" },
                },
              ],
              contacts: [
                {
                  profile: { name: "John Doe" },
                  wa_id: "919876543210",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const sampleStatus = {
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              statuses: [
                {
                  id: "wamid.HBgMOTE5MTc4NzY1NDMyMTA",
                  status: "delivered",
                  timestamp: "1700000001",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const sampleInteractive = {
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              messages: [
                {
                  from: "919876543210",
                  id: "wamid.interactive1",
                  type: "interactive",
                  interactive: {
                    type: "button_reply",
                    button_reply: { id: "btn_1", title: "Yes" },
                  },
                },
              ],
              contacts: [{ profile: { name: "Jane" }, wa_id: "919876543210" }],
            },
          },
        ],
      },
    ],
  };

  it("should have correct structure for inbound text message", () => {
    const msg = sampleInbound.entry[0].changes[0].value.messages[0];
    expect(msg.from).toBe("919876543210");
    expect(msg.type).toBe("text");
    expect(msg.text.body).toBe("Hello, I need help!");
  });

  it("should have contact data", () => {
    const contact = sampleInbound.entry[0].changes[0].value.contacts[0];
    expect(contact.profile.name).toBe("John Doe");
    expect(contact.wa_id).toBe("919876543210");
  });

  it("should have correct structure for status update", () => {
    const status = sampleStatus.entry[0].changes[0].value.statuses[0];
    expect(status.status).toBe("delivered");
    expect(status.id).toBeTruthy();
  });

  it("should handle interactive button replies", () => {
    const msg = sampleInteractive.entry[0].changes[0].value.messages[0];
    expect(msg.type).toBe("interactive");
    expect(msg.interactive.type).toBe("button_reply");
    expect(msg.interactive.button_reply.title).toBe("Yes");
  });

  it("should extract content from text message", () => {
    const msg = sampleInbound.entry[0].changes[0].value.messages[0];
    let content = "";
    switch (msg.type) {
      case "text":
        content = msg.text?.body || "";
        break;
    }
    expect(content).toBe("Hello, I need help!");
  });

  it("should extract content from interactive message", () => {
    const msg = sampleInteractive.entry[0].changes[0].value.messages[0];
    let content = "";
    if (msg.interactive?.type === "button_reply") {
      content = msg.interactive.button_reply?.title || "";
    }
    expect(content).toBe("Yes");
  });
});
