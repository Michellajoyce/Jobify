import jwt from "jsonwebtoken";
import { UnAuthenticatedError } from "../errors/index.js";

const auth = (request, response, next) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    console.log(payload);
    
    request.user = { userId: payload.userId }
    next();
  } catch (error) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};
export default auth;
