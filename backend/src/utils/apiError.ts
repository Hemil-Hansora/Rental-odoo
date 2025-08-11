class ApiError extends Error {
    
    public data: null = null;
    public success: boolean = false;

    constructor(
        public statusCode: number,
        public message: string = "Something went wrong",
        public error: unknown[] = [],
        public stack: string = ""
    ) {
        super(message);

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };