# NVIDIA NIM API — Models Summary

> Same API key · Same endpoint · 3 different models for 3 different jobs

---

## 1. 🚀 GPT-OSS-20B
`model: "openai/gpt-oss-20b"`

| | |
|---|---|
| **Parameters** | 21B total / 3.6B active |
| **Context Window** | 128,000 tokens |
| **Speed** | ⚡ Very fast |
| **RAM required** | 16 GB |
| **Quality level** | ~ OpenAI o3-mini |
| **NVIDIA NIM stability** | ✅ Stable |

### ✅ When to use it
- Chatbots and conversational apps
- Rapid prototyping and testing
- Low-latency use cases
- Local or edge deployment
- When you want fast responses and don't need maximum quality
- First choice when gpt-oss-120b times out

### ❌ When NOT to use it
- Very complex multi-step reasoning
- Advanced code generation tasks
- Tasks requiring o4-mini level intelligence

---

## 2. 🧠 GPT-OSS-120B
`model: "openai/gpt-oss-120b"`

| | |
|---|---|
| **Parameters** | 117B total / 5.1B active |
| **Context Window** | 128,000 tokens |
| **Speed** | 🐢 Slower |
| **RAM required** | 80 GB (datacenter GPU) |
| **Quality level** | ~ OpenAI o4-mini |
| **NVIDIA NIM stability** | ⚠️ Occasional timeouts |

### ✅ When to use it
- Production applications requiring high accuracy
- Complex reasoning and logic tasks (Monty Hall, multi-step problems)
- Advanced code generation and debugging
- Long document analysis (up to 128k tokens)
- Agentic workflows with tool use
- When quality matters more than speed

### ❌ When NOT to use it
- Real-time / low-latency applications
- Simple Q&A or basic chat
- High-volume requests (use 20b to save credits)

---

## 3. 🔢 LLaMA NV EmbedQA 1B v2
`model: "nvidia/llama-3.2-nv-embedqa-1b-v2"`

| | |
|---|---|
| **Type** | Embedding model (not chat) |
| **Output** | Vector of numbers (1536 dimensions) |
| **Endpoint** | `/v1/embeddings` (not `/v1/chat/completions`) |
| **pgvector compatible** | ✅ Yes (stays under 2000-dim limit) |
| **Dimensions** | Configurable — use **1536** for pgvector |

### ✅ When to use it
- Storing documents in pgvector / any vector database
- Semantic search ("find me documents similar to this")
- RAG (Retrieval Augmented Generation) pipelines
- Comparing similarity between two texts
- Building a knowledge base the AI can search
- Any time you need to convert text → numbers

### ❌ When NOT to use it
- Generating text responses (use 20b or 120b for that)
- Direct Q&A without a vector database

---

## 🔄 How They Work Together

```
User Question
     │
     ▼
[EmbedQA 1B v2] ──→ Convert question to vector
     │
     ▼
[pgvector] ──→ Find most similar documents
     │
     ▼
[GPT-OSS-20B or 120B] ──→ Generate answer using found documents
     │
     ▼
Final Answer
```

---

## 📊 Quick Decision Table

| Situation | Model to use |
|---|---|
| I want to chat with AI | `gpt-oss-20b` |
| I need high quality reasoning | `gpt-oss-120b` |
| I need fast responses | `gpt-oss-20b` |
| I'm storing text in a database | `llama-3.2-nv-embedqa-1b-v2` |
| I'm building a search engine | `llama-3.2-nv-embedqa-1b-v2` |
| I'm building RAG | `embedqa` + `gpt-oss-20b` or `120b` |
| I'm testing / prototyping | `gpt-oss-20b` |
| I'm getting timeout errors | Switch from `120b` → `gpt-oss-20b` |

---

## 🔑 API Reference

```
Base URL:   https://integrate.api.nvidia.com/v1
Auth:       Authorization: Bearer YOUR_API_KEY

Chat:       POST /chat/completions  → gpt-oss-20b / gpt-oss-120b
Embeddings: POST /embeddings        → llama-3.2-nv-embedqa-1b-v2
```

### Chat body
```json
{
  "model": "openai/gpt-oss-20b",
  "messages": [{ "role": "user", "content": "Hello!" }],
  "temperature": 1,
  "max_tokens": 1024,
  "stream": false
}
```

### Embedding body
```json
{
  "model": "nvidia/llama-3.2-nv-embedqa-1b-v2",
  "input": ["Text to embed"],
  "input_type": "passage",
  "dimensions": 1536
}
```

---

## 💰 Free Tier Limits

| Limit | Value |
|---|---|
| Free credits | 1,000 (up to 5,000 with business email) |
| Rate limit | 40 requests/min (200 with upgrade) |
| Cost | **$0 — completely free** |
| Context window (chat) | 128,000 tokens |
| Max dimensions (embed) | 1536 (for pgvector compatibility) |

---

*Generated from NVIDIA NIM API testing session — June 2026*
