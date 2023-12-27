// eslint-disable-next-line no-unused-vars
const globalErrorHandler =(error,req,res,next)=>{
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "Error";

    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stack: error.stack
    });
};

export default globalErrorHandler;