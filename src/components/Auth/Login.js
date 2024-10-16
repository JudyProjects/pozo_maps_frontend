import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/api/auth/login`, { email, password }, {withCredentials: true});
            if (response.data.auth) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error en el inicio de sesión', error);
            alert('Error en el inicio de sesión');
        }
    };

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                <h1>Login</h1>
                <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Iniciar sesión</button>
            </form>
        </div>
    );
};

export default Login;