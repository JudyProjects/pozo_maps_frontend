import React, { useState } from 'react';
import axios from 'axios';
import '../../Auth.css';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    const borrarAlerta = () => {
        setTimeout(() => {
            setErrorMessage('');
        }, 3000);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/api/auth/login`, { email, password }, { withCredentials: true });
            if (response.data.auth) {
                window.location.href = '/';
            }
        } catch (error) {
            setErrorMessage('Error en el inicio de sesión');
            borrarAlerta();
        }
    };

    return (
        <div className="d-flex flex-column justify-content-center p-5 align-items-center space-grotesk min-vh-100 divPrincipal">
            <div className='d-flex justify-content-center p-5 divRegistro fs-5'>
                <h1>Login</h1>
            </div>
            <form className='formularioAuth' onSubmit={handleSubmit}>
                <div className='form-group m-3'>
                    <label>Correo electrónico:</label>
                    <input type="email" className='form-control' value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className='form-group m-3'>
                    <label>Contraseña:</label>
                    <input type="password" className='form-control' value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                    <a href="/register" className='m-3 btnSecundario text-decoration-none linksAuth'>Crear cuenta</a>
                </div>
                {errorMessage && (
                    <div className='w-100 d-flex justify-content-center align-items-center'>
                        <div className="alert alert-danger w-75" role="alert">
                            {errorMessage}
                        </div>
                    </div>
                )}
                <div className='d-flex justify-content-center align-items-center'>
                    <button type="submit" className='btn btn-primary m-3 btnPrimario w-50'>Iniciar sesión</button>
                </div>
            </form>
        </div>
    );
};

export default Login;