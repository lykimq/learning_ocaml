import { useState, useEffect } from 'react';
import { addUser, updateUser } from '../../../services/userService';

export const useUserForm = (userData, onSubmit) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('user');
    const [profilePicture, setProfilePicture] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (userData) {
            setEmail(userData.email || '');
            setUsername(userData.username || '');
            setRole(userData.role || 'user');
            setProfilePicture(userData.profile_picture || '');
        }
    }, [userData]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        setSubmitError('');
        const validationErrors = {};

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedUsername = username.trim();
        const trimmedRole = role.trim();

        if (!trimmedEmail) {
            validationErrors.email = 'Email is required';
        } else if (!validateEmail(trimmedEmail)) {
            validationErrors.email = 'Invalid email format';
        }

        if (!userData && !trimmedPassword) {
            validationErrors.password = 'Password is required for new users';
        }

        if (!trimmedUsername) {
            validationErrors.username = 'Username is required';
        }

        if (!trimmedRole) {
            validationErrors.role = 'Role is required';
        }

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setSubmitError('Please fill in all required fields');
            return;
        }

        const formData = {
            email: trimmedEmail,
            username: trimmedUsername,
            role: trimmedRole,
            ...(trimmedPassword && { password: trimmedPassword }),
            ...(profilePicture.trim() && { profile_picture: profilePicture.trim() }),
        };

        try {
            let result;
            if (userData?.id) {
                result = await updateUser(userData.id, formData);
            } else {
                if (!trimmedPassword) {
                    setSubmitError('Password is required for new users');
                    return;
                }
                result = await addUser(formData);
            }
            if (result) {
                onSubmit(result);
            }
        } catch (error) {
            console.error('Error managing user:', error);
            setSubmitError(error.message || 'Failed to manage user');
        }
    };

    return {
        email, setEmail,
        password, setPassword,
        username, setUsername,
        role, setRole,
        profilePicture, setProfilePicture,
        errors,
        showPassword, setShowPassword,
        submitError,
        handleSubmit,
    };
};