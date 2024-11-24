import { PostHog } from 'posthog-node'


export const client = process.env.NODE_ENV === `production` ? new PostHog(
    process.env.POSTHOG_API_KEY_PROD,
    { host: process.env.POSTHOG_HOST_PROD }
) : new PostHog(
    process.env.POSTHOG_API_KEY_DEV,
    { host: process.env.POSTHOG_HOST_DEV }
);




export const posthogUserPaymentCompleted = async (distinct_id) => {
    try {
        client.capture({
            distinctId: `${distinct_id}`,
            event: `paymentCompleted`,
        });

    } catch (error) {
        throw error;
    } finally {
        client.shutdown()
    };
}; 




// export const posthogUserLoggedIn = async (distinct_id) => {
//     try {
//         client.capture({
//             distinctId: `${distinct_id}`,
//             event: `userLoggedIn`
//         });
//     } catch (error) {
//         throw error;
//     } finally {
//         await client.shutdown()
//     };
// }; //! CURRENTLY NOT USED, WILL NEED TO REACTIVATE THEM AFTER CREATING A WAY FOR USERS TO LOG IN (#49)

// export const posthogUserLoggedOut = async (distinct_id) => {
//     try {
//         client.capture({
//             distinctId: `${distinct_id}`,
//             event: `userLoggedOut`
//         });
//     } catch (error) {
//         throw error;
//     } finally {
//         await client.shutdown()
//     };
// }; //! CURRENTLY NOT USED, WILL NEED TO REACTIVATE THEM AFTER CREATING A WAY FOR USERS TO LOG IN (#49)



// export const client =  new PostHog(
//     `${process.env.POSTHOG_API_KEY}`,
//     { host: 'https://webhook.site/efc0e487-0d95-44eb-9ba1-f66b248d1c1b', flushInterval: 0,
//         flushAt: 1,
//     }
// ); //* Uncomment for debugging

/* 
https://webhook.site/#!/view/efc0e487-0d95-44eb-9ba1-f66b248d1c1b/d26a0008-2a26-4979-b57a-40f19993ebdf/1 //* Webhook.site link for debugging the PostHog events

https://posthog.com/docs/product-analytics/troubleshooting //* PostHog troubleshooting documentation

*/
