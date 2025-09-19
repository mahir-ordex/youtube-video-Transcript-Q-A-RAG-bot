import express, { type Request, type Response } from "express";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { pipeline } from "@xenova/transformers";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import dotenv from "dotenv";
import cors from "cors"
dotenv.config();

const app = express();
app.use(express.json())
app.use(cors({
    origin: "*", // Or specific origins that match your extension
    methods: ["GET", "POST"],
    credentials: true
}));

let docs: string[] = [];

const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "question",   // 👈 tells memory: only track "question"
    outputKey: "response",    // 👈 label model’s output
});


app.post("/transcript", async (req: Request, res: Response) => {
    const { url } = req.body;
    if(!url){
        throw new Error("URL Not Found!")
    }
    try {
        docs = []
        const loader = YoutubeLoader.createFromUrl(url as string, {
            language: "en",
            addVideoInfo: true,
        });

        const transcript = await loader.load();
        const fullTranscript = transcript.map(doc => doc.pageContent).join("\n");

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        });
        docs = await splitter.splitText(fullTranscript);

        return res.json({
            success: true,
            chunks: docs,
        });
    } catch (err) {
        console.error("Transcript error:", err);
        return res.status(500).json({ success: false, error: err });
    }
});


app.get("/chat", async (req: Request, res: Response) => {
    // Get the user's question from the query string, or default to a prompt
    try {

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        const question = req.query.question as string || "explain this";

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            apiKey: process.env.gemini_api_key!,
            maxOutputTokens: 2048,
        });

        const prompt = PromptTemplate.fromTemplate(
            `You are a helpful teacher. Use this transcript context:\n{context}\n\nChat history:\n{chat_history}\n\nUser Question: {question}\n\nAnswer clearly and concisely.`
        );

        const chain = new ConversationChain({
            llm: model,
            prompt,
            memory,
        });

        let response = await chain.call({
            context: docs,
            question,
        });

        res.write(`data: ${JSON.stringify({ success: true, input: question, output: response.response })}\n\n`);
        res.end();
    } catch (err) {
        console.error("Transcript error:", err);
        return res.status(500).json({ success: false, error: err });
    }
});

app.listen(3000, () => {
    console.log("Server listening on 3000");
});
