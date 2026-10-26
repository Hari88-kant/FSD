import app from './app.js';
import { connectDB, env } from './config/db.js';

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn(
      '[Warning] Starting server while MongoDB is unreachable. API calls requiring DB will return HTTP 503 until MongoDB connects.'
    );
  }

  app.listen(env.PORT, () => {
    console.log(`[Smart EB Connect] Server running on http://localhost:${env.PORT}`);
    console.log(`[Smart EB Connect] Health check: http://localhost:${env.PORT}/api/health`);
  });
}

startServer();
