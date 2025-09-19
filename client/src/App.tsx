import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { role: "user", text: input }]);
    setLoading(true);

    // Close any previous stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Start new SSE connection
    const eventSource = new EventSource(
      `http://localhost:3000/chat-stream?question=${encodeURIComponent(input)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((msgs) => {
        // If last message is bot, append; else, add new bot message
        if (msgs.length && msgs[msgs.length - 1].role === "bot") {
          const updated = [...msgs];
          updated[updated.length - 1].text += data.output;
          return updated;
        } else {
          return [...msgs, { role: "bot", text: data.output }];
        }
      });
    };

    eventSource.onerror = () => {
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Error connecting to server." },
      ]);
      setLoading(false);
      setInput("");
      eventSource.close();
    };
  };

  return (
    <div className="chat-container">
      <h2>YouTube Transcript Q&A Chat</h2>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "chat-user" : "chat-bot"}>
            <b>{msg.role === "user" ? "You" : "Bot"}:</b> {msg.text}
          </div>
        ))}
        {loading && <div className="chat-bot">Bot: ...</div>}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Ask a question about the transcript..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
