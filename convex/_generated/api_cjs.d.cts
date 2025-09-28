/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiFiles from "../aiFiles.js";
import type * as auth from "../auth.js";
import type * as evaluations from "../evaluations.js";
import type * as http from "../http.js";
import type * as websiteMaps from "../websiteMaps.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiFiles: typeof aiFiles;
  auth: typeof auth;
  evaluations: typeof evaluations;
  http: typeof http;
  websiteMaps: typeof websiteMaps;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
