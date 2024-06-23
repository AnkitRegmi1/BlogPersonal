import { Link } from "react-router-dom";
import { useState, useEffect, useContext } from 'react';
import { UserContext } from "./UserContext";

export default function Header() {
    const { userInfo, setUserInfo } = useContext(UserContext);

    useEffect(() => {
        fetch('http://localhost:4000/profile', {
            credentials: 'include',
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch user profile');
            }
        })
        .then(userInfo => {
            setUserInfo(userInfo);
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
    }, [userInfo]); // Dependency on userInfo to trigger fetch on login/logout

    function logout() {
        fetch('http://localhost:4000/logout', {
            credentials: 'include',
            method: 'POST'
        })
        .then(() => {
            setUserInfo(null);
        })
        .catch(error => {
            console.error('Logout failed:', error);
        });
    }

    // Ensure username is defined before accessing it
    const username = userInfo?.username;

    return (
        <header>
            <Link to="/" className="logo">AR</Link>
            <nav>
                {username ? (
                    <>
                        <Link to="/create">Create new post</Link>
                        <a onClick={logout}>Logout</a>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
