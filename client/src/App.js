import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import "./App.css";
function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const eventSourceRef = useRef(null);
    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                // Request URL from background script
                chrome.runtime.sendMessage({ action: "getYoutubeUrl" }, async (response) => {
                    if (response.url) {
                        const currentUrl = response.url;
                        console.log("Got YouTube URL:", currentUrl);
                        try {
                            const response = await fetch("http://localhost:3000/transcript", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ url: currentUrl })
                            });
                            if (response.ok) {
                                console.log("Transcript fetched successfully");
                                setMessages([{ role: "bot", text: "Transcript loaded! Ask me anything about this video." }]);
                            }
                            else {
                                // Server error
                                const errorText = await response.text();
                                console.error("Server error:", errorText);
                                setMessages([{ role: "bot", text: "Server error loading transcript. Please check your backend." }]);
                            }
                        }
                        catch (error) {
                            console.error("Network error:", error);
                            setMessages([{ role: "bot", text: "Could not connect to server. Is your backend running?" }]);
                        }
                    }
                    else {
                        console.error("No YouTube URL found:", response.error);
                        setMessages([{ role: "bot", text: "Please open a YouTube video to use this extension." }]);
                    }
                });
            }
            catch (error) {
                console.error("Extension error:", error);
                setMessages([{ role: "bot", text: "Error in extension. Please try reloading." }]);
            }
        };
        fetchTranscript();
        // Listen for URL updates while side panel is open
        const messageListener = (message) => {
            if (message.action === "youtubeUrlUpdated") {
                fetchTranscript();
            }
        };
        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);
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
        const eventSource = new EventSource(`http://localhost:3000/chat?question=${encodeURIComponent(input)}`);
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