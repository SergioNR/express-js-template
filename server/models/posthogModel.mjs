import { client } from "../config/posthog-node.mjs";

export const posthogUserSignedUp = async (distinctId, user) => {
    try {
        client.capture({
            distinctId: distinctId,
            event: `userSignedUp`,
            properties: {
                userEmail: user.userDetails.email,
            }
        });

    } catch (error) {
        console.log(`error`, error)
        throw error;
    } finally {
        await client.shutdown()
    };
};

export const posthogUserSuccessLoggedIn = async (distinctId, loginMethod) => {
    try {
        client.capture({
            distinctId: distinctId,
            event: `userLoggedIn`,
            properties: {
                loginMethod: loginMethod
            }
        });

    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};

export const posthogUserLoggedOut = async (distinctId) => {
    try {
        client.capture({
            distinctId: distinctId,
            event: `userLoggedOut`
        });        

    } catch (error) {
        throw error;
    } finally {
        await client.shutdown()
    };
};
