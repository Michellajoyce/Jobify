import { StatusCodes } from 'http-status-codes'
import CustomAPIError from './custom-api.js'

// Login authentication
class UnAuthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.UNAUTHORIZED
  }
};
export default UnAuthenticatedError;