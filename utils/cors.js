const ALLOWED_ORIGIN = "https://levelup-wine-one.vercel.app";

export function setCors(res, req) {
  const origin = req.headers.origin;
  // Allow the deployed frontend and localhost for dev
  if (origin === ALLOWED_ORIGIN || (origin && origin.startsWith("http://localhost"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

export function handleCors(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // signals caller to return early
  }
  return false;
}
