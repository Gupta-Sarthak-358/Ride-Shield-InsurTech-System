
export default async function handler(req, res) {
  const backendBaseUrl = process.env.BACKEND_URL;

  if (!backendBaseUrl) {
    res.status(500).json({ error: "Proxy misconfiguration", details: "BACKEND_URL is not set" });
    return;
  }
  
  // Extract the path from the request URL
  // req.url includes the query string and starts with /api/proxy
  const path = req.url.replace(/^\/api\/proxy/, "");
  const targetUrl = `${backendBaseUrl.replace(/\/$/, "")}${path}`;

  console.log(`Proxying ${req.method} ${req.url} -> ${targetUrl}`);

  try {
    // Surgical header forwarding
    const headers = {
      "Content-Type": "application/json",
    };

    // Forward Authorization if present
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    // Forward Cookie if present (for session auth)
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward the body for non-GET/HEAD requests
    if (!["GET", "HEAD"].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    const location = response.headers.get("location");
    if (location) {
      res.setHeader("Location", location);
    }

    const setCookie = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie");
    if (setCookie && (Array.isArray(setCookie) ? setCookie.length > 0 : true)) {
      res.setHeader("Set-Cookie", setCookie);
    }

    res.status(response.status).send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
