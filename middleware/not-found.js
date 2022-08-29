const notFoundMiddleware = (request, response) => {
    response.status(404).send('Route does not exist')
};

export default notFoundMiddleware;