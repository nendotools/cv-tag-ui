import { defineEventHandler } from "h3";

export default defineEventHandler((_) => {
  return { message: "no results" };
});
