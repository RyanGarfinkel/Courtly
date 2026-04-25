import { auth0 } from "@/lib/auth0";

export default auth0.middleware.bind(auth0);

export const config = {
	matcher: ["/auth/:path*", "/dashboard/:path*"],
};
