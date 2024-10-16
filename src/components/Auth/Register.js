import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/api/auth/register`, {
                name,
                email,
                password,
            });
            if (response.data.auth) {
                alert('Registro exitoso');
            }
        } catch (error) {
            console.error('Error en el registro', error);
        }
    }

    return (
        <form onSubmit={handleRegister}>
            <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Registrarse</button>
        </form>
    );
};

export default Register;