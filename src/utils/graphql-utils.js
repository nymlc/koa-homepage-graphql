const getDecodedTokenFromContext = (context = {}) => {
    const { auth } = context;
    if (auth && auth.decodedToken) {
        return auth.decodedToken;
    }
    return {};
};
export { getDecodedTokenFromContext };
