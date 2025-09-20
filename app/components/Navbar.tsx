import {Link} from "react-router";
import { SignOutButton } from "./SignOutButton";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex items-center space-x-4">
                <Link to="/jobs" className="text-gray-700 hover:text-blue-600 transition-colors">
                    Job Search
                </Link>
                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>
                <SignOutButton />
            </div>
        </nav>
    )
}
export default Navbar
