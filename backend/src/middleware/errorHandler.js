export const notFound = (req, res) => res.status(404).json({ error: 'Route not found' });

export const errorHandler = (err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
};

