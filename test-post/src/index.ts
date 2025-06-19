import 'reflect-metadata';
import express from 'express';
import { config, validateConfig } from './config';
import { PostHandler } from './handlers/post.handler';

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/posts', PostHandler.createPost);
app.get('/posts/:id', PostHandler.getPost);
app.get('/authors/:authorId/posts', PostHandler.getPostsByAuthor);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const { host, port } = config.server;

app.listen(port, host, () => {
  console.log(`🚀 Server is running at http://${host}:${port}`);
  console.log(`📊 Health check: http://${host}:${port}/health`);
  console.log(`📝 Create post: POST http://${host}:${port}/posts`);
  console.log(`📖 Get post: GET http://${host}:${port}/posts/:id`);
  console.log(`👤 Get author posts: GET http://${host}:${port}/authors/:authorId/posts`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 