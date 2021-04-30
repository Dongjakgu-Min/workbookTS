declare namespace Express {
    interface Request {
        newFileName?: string,
        user?: {
            isAdmin: boolean
        }
    }
}