import { client } from "../config/posthog-node.mjs";

export const posthogUserSignedUp = async (distinct_id, userEmail) => {
    try {
        client.capture({
            distinctId: `${distinct_id}`,
            event: `userSignUp`,
            properties: {
                userEmail: `${userEmail}`
            }
        });

    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};

export const posthogUserLoggedIn = async (distinct_id) => {
    try {
        client.capture({
            distinctId: `${distinct_id}`,
            event: `userLoggedIn`
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
    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};
