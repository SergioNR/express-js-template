import { logger } from "../config/logger.mjs";
import { client } from "../config/posthog-node.mjs";

export const posthogUserSignedUp = async (createdUser) => {
    try {
        client.capture({
            distinctId: `${createdUser._id}`,
            event: `userSignedUp`,
            properties: {
                userEmail: `${createdUser.userDetails.email}`
            }
        });

        logger.info({
            message: `User signed up event sent to Posthog`,
            userId: createdUser._id,
            userEmail: createdUser.userDetails.email
        });

    } catch (error) {
        console.log(`error`, error)
        throw error;
    } finally {
        await client.shutdown()
    };
};

export const posthogUserSuccessLoggedIn = async (distinct_id) => {
    try {
        client.capture({
            distinctId: `${distinct_id}`,
            event: `userLoggedIn`
        });


        logger.info({
            message: `User logged in event sent to Posthog`,
            userId: {distinct_id},
        });

    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};


export const posthogUserLoggedOut = async (distinct_id) => {
    try {
        client.capture({
            distinctId: `${distinct_id}`,
            event: `userLoggedOut`
        });

        logger.info({
            message: `User logged out event sent to Posthog`,
            userId: createdUser._id,
        });

    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};
