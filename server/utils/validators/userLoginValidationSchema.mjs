export const userLoginValidationSchema = {
    username: {
        isString: {
            errorMessage: `input value is not a string`
        },
        isEmail: {
            errorMessage: 'Please enter a valid email address'
        },
        normalizeEmail: true,
        escape: true
    },
    password: {
        isLength: {
            options: {
                min: 6,
                max: 32
                },
            errorMessage: `Password must be between 6-32 characters long`
            },
        trim: true,
        escape: true
        }
    }