import { NavLink } from 'react-router'
import LogOutButton from '../navBarElements/LogOutButton'

const AdminNavBar = () => {
    return (
        <div className="navBarWrapper">

            <div className="logoContainer">
                <NavLink to="/">
                    <img src="/logo.svg" alt="logo" />
                </NavLink>
            </div>

        
            <nav className='navBar'>
                <ul className='navBarUl'>
                    <li>
                        <NavLink to="/admin">admin home</NavLink>
                    </li>
                </ul>
            </nav>


            <div className='buttonWrapper'>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">register</NavLink>


                <LogOutButton /> {/* Add LogoutButton component here */}
            </div>
        </div>
    )
};

export default AdminNavBar;