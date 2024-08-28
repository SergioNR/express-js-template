import expressAsyncHandler from "express-async-handler";

export const asyncHandler = (fn) => expressAsyncHandler(fn);