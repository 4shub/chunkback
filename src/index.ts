import { createServer } from './server/create-server/create-server';
import { authMiddleware } from './middleware/auth/auth';

const PORT = process.env.PORT || 3000;

// Create server with auth middleware
// Note: For open source version, this can be created without middleware
const app = createServer({
  middleware: [authMiddleware]
});

app.listen(PORT, () => {
  console.log(`Chunkback API Server running on port ${PORT}`);
  console.log(`OpenAI endpoint: http://localhost:${PORT}/v1/chat/completions`);
  console.log(`Anthropic endpoint: http://localhost:${PORT}/v1/messages`);
  console.log(`Gemini endpoint: http://localhost:${PORT}/v1/models/:model/generateContent`);
});
