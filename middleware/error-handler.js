import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (error, request, response, next) => {
  console.log(error);

  const defaultError = {
    statusCodes: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: error.message || "Something went wrong, try again later",
  };

  if (error.name === "ValidationError") {
    defaultError.statusCodes = StatusCodes.BAD_REQUEST;
    // defaultError.msg = error.message
    defaultError.msg = Object.values(error.errors)
      .map((item) => item.message)
      .join(",")
  };

  if (error.code && error.code === 11000){
    defaultError.statusCodes = StatusCodes.BAD_REQUEST
    defaultError.msg = `${Object.keys(error.keyValue)} field has to be unique`
  }
    
    response.status(defaultError.statusCodes).json({ msg: defaultError.msg });
};

export default errorHandlerMiddleware;
