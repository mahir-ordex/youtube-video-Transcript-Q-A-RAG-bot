import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from "react";
import "./App.css";
function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const eventSourceRef = useRef(null);
    const sendMessage = () => {
        if (!input.trim())
            return;
        setMessages((msgs) => [...msgs, { role: "user", text: input }]);
        setLoading(true);
        // Close any previous stream
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        // Start new SSE connection
        const eventSource = new EventSource(`http://localhost:3000/chat-stream?question=${encodeURIComponent(input)}`);
        eventSourceRef.current = eventSource;
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((msgs) => {
                // If last message is bot, append; else, add new bot message
                if (msgs.length && msgs[msgs.length - 1].role === "bot") {
                    const updated = [...msgs];
                    updated[updated.length - 1].text += data.output;
                    return updated;
                }
                else {
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
    return (_jsxs("div", { className: "chat-container", children: [_jsx("h2", { children: "YouTube Transcript Q&A Chat" }), _jsxs("div", { className: "chat-box", children: [messages.map((msg, idx) => (_jsxs("div", { className: msg.role === "user" ? "chat-user" : "chat-bot", children: [_jsxs("b", { children: [msg.role === "user" ? "You" : "Bot", ":"] }), " ", msg.text] }, idx))), loading && _jsx("div", { className: "chat-bot", children: "Bot: ..." })] }), _jsxs("div", { className: "chat-input", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && !loading && sendMessage(), placeholder: "Ask a question about the transcript...", disabled: loading }), _jsx("button", { onClick: sendMessage, disabled: loading || !input.trim(), children: "Send" })] })] }));
}
export default App;
//# sourceMappingURL=App.js.map