import { PublicRoutes } from "./views/public/routes";

/**
 * This is the entry point for public routes. Most components are not loaded
 * in this route.
 *
 * @export
 * @returns
 */
export default function ConnectedApp() {
    return <PublicRoutes />;
}
