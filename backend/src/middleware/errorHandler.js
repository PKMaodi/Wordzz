const { sql } = require('../config/database');

const CLIENT_ERROR_MESSAGES = {
  'entity.parse.failed': 'The request body is not valid JSON.',
  'entity.too.large': 'The request is too large.'
};

const DATABASE_CONFLICT_MESSAGES = {
  547: 'This change conflicts with saved data, for example a word that no longer exists. Refresh the page and try again.',
  2601: 'This already exists. Refresh the page to see the latest list.',
  2627: 'This already exists. Refresh the page to see the latest list.'
};

function notFound(req, res) {
  res.status(404).json({
    statusCode: 404,
    message: 'This address does not exist. Check the URL and try again.'
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.status >= 400 && error.status < 500) {
    const body = {
      statusCode: error.status,
      message: CLIENT_ERROR_MESSAGES[error.type] || 'The request could not be processed.'
    };
    if (Array.isArray(error.errors)) {
      body.errors = error.errors;
    }
    return res.status(error.status).json(body);
  }

  if (error instanceof sql.RequestError && DATABASE_CONFLICT_MESSAGES[error.number]) {
    return res.status(409).json({
      statusCode: 409,
      message: DATABASE_CONFLICT_MESSAGES[error.number]
    });
  }

  console.error(error);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error'
  });
}

module.exports = { notFound, errorHandler };
