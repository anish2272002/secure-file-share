import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import { sanitizeInput } from '../utils/sanitize';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'regular',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords must match';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        const sanitizedValues = {
          username: sanitizeInput(formData.username),
          email: sanitizeInput(formData.email),
          password: formData.password,
          role: formData.role,
        };
        await dispatch(register(sanitizedValues)).unwrap();
        navigate('/login');
      } catch (err) {
        console.error('Registration error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{
           background: 'linear-gradient(to bottom, #E91E63, #9C27B0, #3F51B5)'
         }}>
      <div className="card shadow border-0" style={{ width: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center mb-4">Register</h2>

          <form onSubmit={handleSubmit}>
            <div className='mb-3'>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="form-control bg-light border-0 py-2 my-2"
                required
              />
              {formErrors.username && <div className="text-danger ps-2">{formErrors.username}</div>}
            </div>

            <div className='mb-3'>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="form-control bg-light border-0 py-2 my-2"
                required
              />
              {formErrors.email && <div className="text-danger ps-2">{formErrors.email}</div>}
            </div>

            <div className='mb-3'>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="form-control bg-light border-0 py-2 my-2"
                autoComplete='off'
                required
              />
              {formErrors.password && <div className="text-danger ps-2">{formErrors.password}</div>}
            </div>

            <div className='mb-3'>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                autoComplete='off'
                onChange={handleChange}
                placeholder="Confirm Password"
                className="form-control bg-light border-0 py-2 my-2"
                required
              />
              {formErrors.confirmPassword && <div className="text-danger ps-2">{formErrors.confirmPassword}</div>}
            </div>

            <div className='mb-3'>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-control bg-light border-0 py-2 my-2"
                required
              >
                <option value="admin">Admin</option>
                <option value="regular">Regular</option>
                <option value="guest">Guest</option>
              </select>
              {formErrors.role && <div className="text-danger ps-2">{formErrors.role}</div>}
            </div>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn w-100 text-white my-3"
              style={{ backgroundColor: '#E91E63' }}
              disabled={isSubmitting || loading}
            >
              {loading ? 'Registering...' : 'REGISTER'}
            </button>

            <div className="text-center" style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Already have an account? {' '}
              <Link 
                to="/login" 
                className="text-decoration-none"
                style={{ color: '#E91E63' }}
              >
                Login now
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
