import { usePuterStore } from "~/lib/puter";

const SignOutButton = () => {
    const { auth, isLoading } = usePuterStore();

    if (!auth.isAuthenticated) {
        return (
            <button 
                onClick={auth.signIn}
                disabled={isLoading}
                className="primary-button w-fit"
            >
                {isLoading ? "Loading..." : "Sign In"}
            </button>
        );
    }

    return (
        <button 
            onClick={auth.signOut}
            disabled={isLoading}
            className="secondary-button w-fit"
        >
            {isLoading ? "Signing out..." : "Sign Out"}
        </button>
    );
};

export { SignOutButton };