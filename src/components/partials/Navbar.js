import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logo from '../../resources/Pozo maps.png';

const Navbar = () => {
    const [username, setUsername] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const navigate = useNavigate();
    const dropdownMenu = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/api/auth/me`, {
                    withCredentials: true
                });
                setUsername(response.data.name);
            } catch (error) {
                if (error.response.status === 401) {
                    console.error('Sin tóken');
                } else {
                    console.error('Error al obtener el usuario:', error);
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_SERVER_PATH}/api/auth/logout`, {}, { withCredentials: true });
            setUsername('');
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownMenu.current && !dropdownMenu.current.contains(event.target)) {
                setDropdownVisible(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/"><img src={logo} className='logoApp' alt="Logo de la aplicación" /></Link>
            </div>
            <div className="navbar-username" onClick={toggleDropdown}>
                {username ? (
                    <div className="dropdown">
                        <span>{username}</span>
                        {dropdownVisible && (
                            <div className="dropdown-menu">
                                <Link to="/perfil" className='anchorMiPerfil'>Mi Perfil</Link>
                                <button onClick={handleLogout}>Cerrar sesión</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className='linksNavbar'>Iniciar sesión</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
