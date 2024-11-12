import React from 'react';
import './Footer.css';
import logoUtec from '../../resources/logoUtec.png';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-logos">
            <Link to="/"><img src={logoUtec} className='logoApp' alt="Logo de la aplicación" /></Link>
            </div>
            <div className="footer-text">
                <p>
                    Desarrollado por&nbsp;
                    <a href="https://www.linkedin.com/in/angelo-festino-337706177/" target="_blank" rel="noopener noreferrer">Angelo Festino</a>
                    &nbsp;y&nbsp;
                    <a href="https://www.linkedin.com/in/franco-sancrist%C3%B3bal-b17541298/" target="_blank" rel="noopener noreferrer">Franco Sancristobal</a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;