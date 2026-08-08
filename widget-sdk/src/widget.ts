interface ChatwootConfig {
  baseUrl: string;
  inboxId: number;
  accountId: number;
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
}

interface Message {
  id: number;
  content: string;
  messageType: "incoming" | "outgoing";
  createdAt: string;
}

class ChatwootWidget {
  private config: ChatwootConfig;
  private container: HTMLDivElement | null = null;
  private chatWindow: HTMLDivElement | null = null;
  private messages: Message[] = [];
  private isOpen = false;
  private ws: WebSocket | null = null;

  constructor(config: ChatwootConfig) {
    this.config = {
      position: "bottom-right",
      primaryColor: "#3b82f6",
      ...config,
    };
    this.init();
  }

  private init() {
    this.createContainer();
    this.createToggleButton();
    this.createChatWindow();
    this.connectWebSocket();
  }

  private createContainer() {
    this.container = document.createElement("div");
    this.container.id = "chatwoot-widget";
    this.container.style.cssText = `
      position: fixed;
      ${this.config.position === "bottom-left" ? "left: 20px" : "right: 20px"};
      bottom: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  private createToggleButton() {
    const button = document.createElement("button");
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.2L4 17.2V4H20V16Z" fill="white"/>
      </svg>
    `;
    button.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${this.config.primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    button.onmouseenter = () => {
      button.style.transform = "scale(1.1)";
    };
    button.onmouseleave = () => {
      button.style.transform = "scale(1)";
    };
    button.onclick = () => this.toggleChat();
    this.container!.appendChild(button);
  }

  private createChatWindow() {
    this.chatWindow = document.createElement("div");
    this.chatWindow.style.cssText = `
      position: absolute;
      bottom: 70px;
      ${this.config.position === "bottom-left" ? "left: 0" : "right: 0"};
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      background: ${this.config.primaryColor};
      color: white;
      padding: 16px;
      font-weight: 600;
    `;
    header.textContent = "Chat with us";
    this.chatWindow.appendChild(header);

    // Messages container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "chatwoot-messages";
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    this.chatWindow.appendChild(messagesContainer);

    // Input area
    const inputArea = document.createElement("div");
    inputArea.style.cssText = `
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    `;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    input.style.cssText = `
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      font-size: 14px;
    `;
    input.onkeypress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(input.value);
        input.value = "";
      }
    };

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.style.cssText = `
      padding: 10px 16px;
      background: ${this.config.primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    `;
    sendButton.onclick = () => {
      this.sendMessage(input.value);
      input.value = "";
    };

    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    this.chatWindow.appendChild(inputArea);

    this.container!.appendChild(this.chatWindow);
  }

  private toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.chatWindow) {
      this.chatWindow.style.display = this.isOpen ? "flex" : "none";
    }
  }

  private async sendMessage(content: string) {
    if (!content.trim()) return;

    // Add message to UI immediately
    this.addMessage({
      id: Date.now(),
      content,
      messageType: "outgoing",
      createdAt: new Date().toISOString(),
    });

    // Send via API
    try {
      await fetch(`${this.config.baseUrl}/api/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: 1, // Will be updated with real conversation
          content,
          messageType: "outgoing",
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.renderMessage(message);
  }

  private renderMessage(message: Message) {
    const messagesContainer = document.getElementById("chatwoot-messages");
    if (!messagesContainer) return;

    const messageEl = document.createElement("div");
    messageEl.style.cssText = `
      display: flex;
      ${message.messageType === "outgoing" ? "justify-content: flex-end" : "justify-content: flex-start"};
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      ${
        message.messageType === "outgoing"
          ? `background: ${this.config.primaryColor}; color: white;`
          : "background: #f3f4f6; color: #111827;"
      }
    `;
    bubble.textContent = message.content;

    messageEl.appendChild(bubble);
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private connectWebSocket() {
    try {
      const wsUrl = this.config.baseUrl.replace("http", "ws");
      this.ws = new WebSocket(
        `${wsUrl}/ws/conversation/1?conversationId=1`
      );

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "message.created") {
          this.addMessage({
            id: data.data.id,
            content: data.data.content,
            messageType: data.data.messageType,
            createdAt: data.data.createdAt,
          });
        }
      };

      this.ws.onclose = () => {
        // Reconnect after 3 seconds
        setTimeout(() => this.connectWebSocket(), 3000);
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
    }
  }
}

// Global initialization
declare global {
  interface Window {
    ChatwootWidget: typeof ChatwootWidget;
    initChatwoot: (config: ChatwootConfig) => ChatwootWidget;
  }
}

window.ChatwootWidget = ChatwootWidget;
window.initChatwoot = (config: ChatwootConfig) => new ChatwootWidget(config);
