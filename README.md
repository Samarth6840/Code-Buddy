# 🤖 CodeBuddy - AI-Powered Code Explanation

> Most people who struggle with code aren't struggling because they're not smart enough. They're struggling because no one explained it to them in human language. A compiler error doesn't tell you why something broke — it just shouts at you in a language that assumes you already know what went wrong. **CodeBuddy changes that.**

## 🎯 What is CodeBuddy?

CodeBuddy is an intelligent code analysis tool powered by Claude AI that transforms confusing code into clear, human-friendly explanations. Whether you're debugging a cryptic error message, trying to understand someone else's code, or learning a new language, CodeBuddy breaks it down in a way that actually makes sense.

### Key Features

- 🧠 **AI-Powered Analysis** - Uses Claude AI to provide intelligent, contextual code explanations
- 📝 **Multiple Analysis Modes** - Explain, document, optimize, and more
- 🎓 **Adaptive Explanations** - Tailored for beginners, intermediate, or advanced developers
- 🌐 **Multi-Language Support** - JavaScript, Python, Java, Go, Rust, SQL, and 15+ more
- 📤 **Multiple Input Methods** - Paste code, upload files, or provide GitHub URLs
- ⚡ **Real-Time Streaming** - Results stream as they're generated via SSE
- 🔒 **Rate Limited** - Fair usage with per-IP and daily limits
- 🎨 **Beautiful UI** - Modern, responsive React interface with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org))
- **pnpm** ([install](https://pnpm.io/installation))
- **Anthropic API Key** ([get one](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Samarth6840/Code-Buddy.git
cd Code-Buddy

# Install dependencies
pnpm install
```

### Configuration

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-or-v1-xxxxxxxxxxxx
PORT=3000
NODE_ENV=development
BASE_PATH=/api
```

**Don't have an API key?** Get one at [console.anthropic.com](https://console.anthropic.com)

### Running the Project

```bash
# Option 1: Run both services in separate terminals

# Terminal 1 - Start the API server
cd artifacts/api-server
pnpm install
pnpm dev

# Terminal 2 - Start the frontend
cd artifacts/codebuddy
pnpm install
pnpm dev
```

The app will be available at `http://localhost:5173` (frontend default) and the API at `http://localhost:3000/api`.

## 📁 Project Structure

```
codebuddy-source/
├── artifacts/
│   ├── api-server/              # Express backend with Claude AI integration
│   │   ├── src/
│   │   │   ├── app.ts          # Express app setup
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── routes/
│   │   │   │   ├── health.ts   # Health check endpoint
│   │   │   │   └── analyze/    # Code analysis with SSE streaming
│   │   │   └── lib/
│   │   │       └── logger.ts   # Pino logger setup
│   │   └── package.json
│   │
│   └── codebuddy/               # React + Vite frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── pages/           # Page components
│       │   └── lib/             # Utilities
│       ├── public/              # Static assets
│       └── package.json
│
├── lib/
│   └── api-spec/
│       └── openapi.yaml         # OpenAPI 3.1.0 specification
│
├── .env                         # Environment variables (local only, not committed)
├── .env.example                 # Environment template
└── pnpm-workspace.yaml          # Monorepo configuration
```

## 🔌 API Endpoints

### Health Check
```http
GET /api/healthz
```

### Analyze Code
```http
POST /api/analyze
Content-Type: application/json

{
  "code": "const x = [1,2,3].map(n => n * 2);",
  "language": "javascript",
  "modes": ["explain"],
  "userLevel": "beginner"
}
```

**Response:** Server-Sent Events (SSE) stream of analysis sections

### Resolve URL
```http
POST /api/resolve-url
Content-Type: application/json

{
  "url": "https://raw.githubusercontent.com/user/repo/main/file.js"
}
```

See [OpenAPI Spec](lib/api-spec/openapi.yaml) for detailed API documentation.

## 🎨 Supported Languages

JavaScript/TypeScript, Python, Java, Go, Rust, C/C++, C#, PHP, Swift, Kotlin, Ruby, Bash, SQL, HTML, CSS, YAML, JSON, and more.

## 📊 Analysis Modes

- **Explain** - Clear breakdown of what the code does
- **Document** - Generate comments and documentation
- **Optimize** - Performance improvement suggestions
- **Debug** - Common bugs and issues to watch for
- **Test** - Testing strategies and examples

## 🎯 User Levels

Explanations are customized for:
- 🟢 **Beginner** - Simple, conceptual explanations with analogies
- 🟡 **Intermediate** - Balanced technical depth with practical context
- 🔴 **Advanced** - Deep technical details and edge cases

## ⚙️ Configuration

### Rate Limiting

- **10 requests/minute** per IP
- **100 requests/day** per IP

Adjust in `artifacts/api-server/src/routes/analyze/index.ts`

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change PORT in .env
PORT=3001

# Or kill the process using the port
lsof -ti:3000 | xargs kill -9
```

**API key not working?**
- Ensure `ANTHROPIC_API_KEY` is in `.env`
- Verify key validity at [console.anthropic.com](https://console.anthropic.com)

**Dependencies not installing?**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 🛠️ Development

### Scripts

```bash
# In root directory
pnpm build        # Build all packages
pnpm typecheck    # Type check all packages

# In artifacts/api-server
pnpm dev          # Start dev server with hot reload
pnpm build        # Build production bundle
pnpm start        # Run production build

# In artifacts/codebuddy
pnpm dev          # Start Vite dev server
pnpm build        # Build production bundle
pnpm serve        # Preview production build
```

### Code Style

- **TypeScript** - Strict mode enabled
- **Prettier** - Code formatting
- **ESLint** - Linting (configured in workspace)

## 📜 License

MIT License - See [LICENSE](LICENSE) for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Tips

- Use **Cmd/Ctrl + Enter** to quickly submit code analysis
- Upload files with **drag & drop** or the upload button
- Share GitHub raw URLs directly in the URL loader
- Try different user levels to find the explanation depth you need

---

**Built with ❤️ by Samarth Joshi**
