// Netlify serverless function wrapper
import serverless from 'serverless-http';
import express from 'express';

// Import your Express app
let app;

const handler = async (event, context) => {
  if (!app) {
    // Dynamically import the server
    const { default: createApp } = await import('../../api/index.ts');
    app = createApp;
  }

  // Use serverless-http to wrap Express app
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};

export { handler };
