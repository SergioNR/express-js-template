import { NavLink } from 'react-router'
import ForgotPasswordLink from '../navBarElements/ForgotPasswordLink';
import RegisterButton from '../navBarElements/RegisterButton';
import LogInButton from '../navBarElements/LogInButton';

const AuthNavBar = () => {
    return (
        <div className="navBarWrapper">

            <div className="logoContainer">
                <NavLink to="/">
                    <img src="/logo.svg" alt="logo" />
                </NavLink>
            </div>

        </div>
    );
};

export default AuthNavBar;