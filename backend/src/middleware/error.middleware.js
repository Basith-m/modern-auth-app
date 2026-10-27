
export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        message:
            statusCode >= 500
                ? "An unexpected server error occurred."
                : err.message || "Request failed.",
    });
};