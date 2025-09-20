import {usePuterStore} from "~/lib/puter";
import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router";

export const meta = () => ([
    { title: 'Resumind | Sign In' },
    { name: 'description', content: 'Sign in to your Resumind account to continue your job search journey' },
])

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extract next parameter from URL, default to home page
    const urlParams = new URLSearchParams(location.search);
    const next = urlParams.get('next') || '/';

    useEffect(() => {
        if(auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate])

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="gradient-border shadow-2xl">
                    <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 md:p-10">
                        {/* Header */}
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Resumind</h1>
                                <p className="text-gray-600 text-lg">Sign in to continue your job search journey</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>AI-powered resume analysis</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Job search automation</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Resume optimization tips</span>
                            </div>
                        </div>

                        {/* Auth Button */}
                        <div className="pt-4">
                            {isLoading ? (
                                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse cursor-not-allowed">
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Signing you in...
                                    </div>
                                </button>
                            ) : (
                                <>
                                    {auth.isAuthenticated ? (
                                        <div className="space-y-4">
                                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                                <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="font-semibold">Successfully signed in!</span>
                                                </div>
                                                <p className="text-sm text-green-600">Redirecting you now...</p>
                                            </div>
                                            <button 
                                                className="w-full bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-700 transition-all duration-200"
                                                onClick={auth.signOut}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
                                            onClick={auth.signIn}
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                                Sign In with Puter
                                            </div>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                            <p>Secure authentication powered by Puter</p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default Auth