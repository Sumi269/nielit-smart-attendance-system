export function notFound(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === "23505") {
    return res.status(409).json({
      error: "A record with this value already exists."
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      error: "The referenced record does not exist or cannot be removed."
    });
  }

  res.status(error.status || 500).json({
    error:
      error.status && error.status < 500
        ? error.message
        : "An unexpected server error occurred."
  });
}