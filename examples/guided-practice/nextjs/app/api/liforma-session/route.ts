import { createLiformaSessionRouteHandler } from '@liforma/client/next';

/** Demo route — open mint. Production apps must pass `authorize`. */
export const POST = createLiformaSessionRouteHandler({ allowUnauthenticated: true });
