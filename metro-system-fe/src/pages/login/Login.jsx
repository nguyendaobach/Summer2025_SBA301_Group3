import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Login.scss';
import axiosInstance from '../../config/axios';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post('https://summer2025-sba301-group3.onrender.com/api/v1/security/login', {
        email: email,
        password: password
      });

      const { status, message, data } = response.data;

      if (status === 200) {
        // Login successful
        const { id, token, fullname, role } = data;

        // Store token and user info in localStorage
        localStorage.setItem("id", id);
        localStorage.setItem("token", token);
        localStorage.setItem("email", email);
        localStorage.setItem("fullName", fullname);
        localStorage.setItem("role", role);

        setSuccess(`Login successful! Welcome ${fullname}`);

        // Redirect based on role
        setTimeout(() => {
          if (role === "ADMIN") {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/";
          }
        }, 1500);
      } else {
        // Handle other status codes
        setError(data || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        // Server responded with an error
        const { status, data } = err.response;
        if (status === 401) {
          setError(data?.data || "Incorrect email or password. Please try again.");
        } else {
          setError(data?.data || "Login failed. Please try again.");
        }
      } else if (err.request) {
        // No response received
        setError("No response from server. Please check your internet connection.");
      } else {
        // Other error
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container fluid className="h-100">
        <Row className="h-100 align-items-center">
          {/* Left Side: Login Form */}
          <Col md={4} className="login-form-col">
            <Card className="login-card">
              <Card.Body>
                <h2 className="mb-4">Đăng nhập</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Nhập email *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Nhập mật khẩu *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="********"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      label="Remember"
                      id="remember-checkbox"
                    />
                    <Link to="/forgot-password" className="text-danger">
                      Quên mật khẩu?
                    </Link>
                  </div>                  <Button variant="danger" type="submit" className="w-100 mb-3" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>

                  
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Side: Placeholder Text */}
          <Col md={8} className="login-text-col">
            <div className="login-text">
              <h1>ĐĂNG NHẬP</h1>
              <p>
                Hệ thống đường sắt đô thị đang xây dựng tại Thành phố Hồ Chí Minh. Dự án là sự kết hợp giữa metro, xe điện mặt đất (tramway) và tàu một ray (monorail).              </p>

            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;