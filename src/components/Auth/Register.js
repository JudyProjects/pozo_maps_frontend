import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();


    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    const borrarAlerta = () => {
        setTimeout(() => {
            setErrorMessage('');
        }, 3000);
    };
    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden.');
            borrarAlerta();
            return;
        }
        if (!validateEmail(email)) {
            setErrorMessage('Correo electrónico inválido.');
            borrarAlerta();
            return;
        }
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER_PATH}/api/auth/register`, {
                name,
                email,
                password,
            }, { withCredentials: true });
            if (response.data.auth) {
                alert('Registro exitoso');
                setErrorMessage('');
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                navigate('/');
            }
        } catch (error) {
            setErrorMessage('Error en el registro.');
            borrarAlerta();
        }
    }

    return (
        <div className='d-flex flex-column justify-content-center p-5 align-items-center space-grotesk divPrincipal'>
            <div className='d-flex justify-content-center p-5 divRegistro fs-5'>
                <h1>Registrarse</h1>
            </div>
            <form className='formularioAuth' onSubmit={handleRegister}>
                <div className='form-group m-3'>
                    <label>Nombre:</label>
                    <input type="text" className='form-control' value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className='form-group m-3'>
                    <label>Correo electrónico:</label>
                    <input type="email" className='form-control' value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className='form-group m-3'>
                    <label>Contraseña:</label>
                    <input type="password" className='form-control' value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group m-3">
                    <label>Confirmar contraseña:</label>
                    <input type="password" className='form-control' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <div>
                    <a href="/login" className='text-decoration-none m-3 linksAuth'>Ya tengo cuenta</a>
                </div>
                {errorMessage && (
                    <div className='w-100 d-flex justify-content-center align-items-center'>
                        <div className="alert alert-danger w-75" role="alert">
                            {errorMessage}
                        </div>
                    </div>
                )}
                <div className='d-flex justify-content-center align-items-center'>
                    <button type="submit" className='btn btn-primary m-3 btnPrimario w-50'>Guardar</button>
                </div>
            </form>
        </div>
    );
};

export default Register;