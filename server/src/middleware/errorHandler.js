export function errorHandler(err, req, res, _next) {
  console.error('[Server Error]', err)

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: err.issues?.[0]?.message || 'Invalid request payload.',
      details: err.issues,
    })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this unique value already exists.',
    })
  }

  const status = err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error.',
  })
}
