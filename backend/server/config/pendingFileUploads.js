//* Lifetime of an unconfirmed upload. Presigned PUT URLs live for minutes
//* (S3_UPLOAD_URL_TTL_SECONDS), so a row still pending after an hour belongs
//* to an upload that was abandoned or never confirmed - the cleanup job
//* deletes its object and then the row
export const PENDING_FILE_MAX_AGE_MS = 60 * 60 * 1000;

//* The cleanup job deletes the bucket object BEFORE the row, so a confirm
//* that flips a row to `ready` while the job is between the two steps would
//* leave a ready row without an object. Confirm therefore stops accepting a
//* row this long before the job may touch it - a confirm that starts inside
//* the window has ample time to finish before the row becomes eligible, and
//* the job only ever lists rows that confirm can no longer flip
export const PENDING_FILE_CONFIRM_SAFETY_MARGIN_MS = 10 * 60 * 1000;

export const PENDING_FILE_CONFIRM_MAX_AGE_MS = PENDING_FILE_MAX_AGE_MS - PENDING_FILE_CONFIRM_SAFETY_MARGIN_MS;
