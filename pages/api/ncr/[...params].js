/**
 * Proxy route for NCR API endpoints.
 * Forwards all /api/ncr/* requests to the FastAPI backend.
 *
 * This allows the Next.js frontend to proxy requests to the FastAPI backend
 * which handles NCR integration endpoints like /api/ncr/test/create-product
 */

export default async function handler(req, res) {
  // Get the FastAPI backend URL from environment variable
  const backendUrl = process.env.FASTAPI_BACKEND_URL || process.env.BACKEND_URL;

  // Validate backend URL is configured
  if (!backendUrl) {
    return res.status(500).json({
      error: 'Backend URL not configured',
      message: 'FASTAPI_BACKEND_URL or BACKEND_URL environment variable must be set'
    });
  }

  // Reconstruct the full path from the catch-all params
  const params = req.query.params || [];
  const path = Array.isArray(params) ? params.join('/') : params;

  // Build the full URL to the FastAPI backend
  const targetUrl = `${backendUrl}/api/ncr/${path}`;

  // Forward query parameters (excluding the catch-all 'params')
  const queryParams = new URLSearchParams();
  Object.keys(req.query).forEach((key) => {
    if (key !== 'params') {
      queryParams.append(key, req.query[key]);
    }
  });
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  try {
    // Forward the request to the FastAPI backend
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward important headers
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
        ...(req.headers['content-type'] && { 'Content-Type': req.headers['content-type'] })
      },
      // Forward request body for POST/PUT/PATCH requests
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body ? JSON.stringify(req.body) : undefined
    });

    // Get response data
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // Forward the response status and JSON data
      res.status(response.status).json(data);
    } else {
      data = await response.text();
      // Forward the response status and text data
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('Error proxying request to FastAPI backend:', error);
    res.status(500).json({
      error: 'Failed to proxy request to backend',
      message: error.message,
      targetUrl: fullUrl,
      backendUrl: backendUrl
    });
  }
}
