import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { FaFacebookF, FaGooglePlusG } from 'react-icons/fa';
import './Login.scss';
import axios from 'axios';
import axiosInstance from '../../config/axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter info, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate password match
  const passwordsMatch = password === confirmPassword;
  // Step 1: Collect user info and send email for OTP
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    if (!email || !fullName || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Only sending email to get OTP at this point
      const response = await axios.post(
        `http://localhost:8080/api/v1/security/register?mail=${encodeURIComponent(email)}`,
        null,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      if (response.data.status === 200) {
        setSuccess('OTP sent to your email. Please check and enter below.');
        setStep(2);
      } else {
        setError(response.data.data || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      if (err.response) {
        // Make sure we're not trying to render an object
        const errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data?.message || err.response.data?.data || 'Failed to send OTP. Please try again.';
        setError(errorMsg);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };
  // Step 2: Submit OTP for verification
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate OTP
    if (!otp) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        email: email,
        password: password,
        fullName: fullName
      };

      // Send verification request with OTP
      const response = await axios.post(
        `http://localhost:8080/api/v1/security/verify?otp=${otp}`,
        signupData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 201 || response.data.status === 200) {
        setSuccess('Registration successful! You can now login with your account.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        // Make sure we're not trying to render an object
        const errorMsg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data?.message || 'Registration failed. Please try again.';
        setError(errorMsg);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container fluid className="h-100">
        <Row className="h-100 align-items-center">
          {/* Left Side: Sign Up Form */}
          <Col md={4} className="login-form-col">
            <Card className="login-card">
              <Card.Body>
                <h2 className="mb-4">Sign up</h2>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                {step === 1 ? (
                  <Form onSubmit={handleSendEmail}>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                      <Form.Label>Enter your E-mail *</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicName">
                      <Form.Label>Enter your Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="First name Last name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                      <Form.Label>Enter your password *</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="********"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        isInvalid={password && confirmPassword && !passwordsMatch}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formConfirmPassword">
                      <Form.Label>Confirm your password *</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="********"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        isInvalid={password && confirmPassword && !passwordsMatch}
                      />
                      {password && confirmPassword && !passwordsMatch && (
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>

                    <Form.Text className="text-muted mb-3 d-block">
                      By signing up, you agree to our terms of use and privacy policy
                    </Form.Text>

                    <Button
                      variant="danger"
                      type="submit"
                      className="w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Request OTP'}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleSubmitRegistration}>
                    <div className="mb-3">
                      <h5>Account Information</h5>
                      <p className="text-muted">Email: {email}</p>
                      <p className="text-muted">Name: {fullName}</p>
                    </div>

                    <Form.Group className="mb-3" controlId="formOtp">
                      <Form.Label>Enter OTP Code *</Form.Label>
                      <Form.Control
                        type="number"
                        inputMode="numeric"
                        placeholder="Enter OTP sent to your email"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      />
                      <Form.Text className="text-muted">
                        Please enter the verification code sent to your email
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex gap-2 mb-3">
                      <Button
                        variant="outline-secondary"
                        onClick={() => setStep(1)}
                        className="w-25"
                      >
                        Back
                      </Button>
                      <Button
                        variant="danger"
                        type="submit"
                        className="w-75"
                        disabled={loading}
                      >
                        {loading ? 'Verifying...' : 'Complete Registration'}
                      </Button>
                    </div>
                  </Form>
                )}

                <div className="mt-3 text-center">
                  <p>Or sign up with social media</p>
                </div>

                <Button
                  variant="primary"
                  className="w-100 mb-2 d-flex align-items-center justify-content-center"
                >
                  <FaFacebookF className="me-2" />
                  Sign up with Facebook
                </Button>

                <Button
                  variant="danger"
                  className="w-100 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: '#dd4b39', borderColor: '#dd4b39' }}
                >
                  <FaGooglePlusG className="me-2" />
                  Sign up with Google+
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Side: Registration Note */}
          <Col md={8} className="login-text-col">
            <div className="login-text">
              <h1>REGISTRATION NOTE</h1>
              <p>
                HCMC Metro là hệ thống đường sắt đô thị đang xây dựng tại Thành phố Hồ Chí Minh. Dự án là sự kết hợp giữa metro, xe điện mặt đất (tramway) và tàu một ray (monorail).
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SignUp;