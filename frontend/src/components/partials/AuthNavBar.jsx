import { NavLink } from 'react-router'

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