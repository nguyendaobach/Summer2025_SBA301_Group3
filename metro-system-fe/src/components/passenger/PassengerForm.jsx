import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import './PassengerForm.css';

const PassengerForm = ({ 
  numberOfTickets = 1, 
  onPassengerChange, 
  userEmail, 
  onValidationChange,
  savedPassengers = [],
  savedIsBuyingForSelf = false,
  onFormDataChange
}) => {
  const [passengers, setPassengers] = useState([]);
  const [isBuyingForSelf, setIsBuyingForSelf] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Nếu có saved data và số lượng tickets khớp, sử dụng saved data
    if (savedPassengers.length > 0 && savedPassengers.length === numberOfTickets) {
      setPassengers(savedPassengers);
      setIsBuyingForSelf(savedIsBuyingForSelf);
    } else if (savedPassengers.length > 0 && savedPassengers.length < numberOfTickets) {
      // Nếu tăng số lượng vé, giữ lại email đã nhập và thêm vé mới
      const existingPassengers = [...savedPassengers];
      const newPassengers = Array(numberOfTickets - savedPassengers.length).fill('').map((_, index) => ({
        id: savedPassengers.length + index + 1,
        email: savedIsBuyingForSelf && userEmail ? userEmail : ''
      }));
      setPassengers([...existingPassengers, ...newPassengers]);
      setIsBuyingForSelf(savedIsBuyingForSelf);
    } else if (savedPassengers.length > 0 && savedPassengers.length > numberOfTickets) {
      // Nếu giảm số lượng vé, giữ lại những vé đầu tiên
      const keptPassengers = savedPassengers.slice(0, numberOfTickets);
      setPassengers(keptPassengers);
      setIsBuyingForSelf(savedIsBuyingForSelf);
    } else {
      // Khởi tạo mới
      const initialPassengers = Array(numberOfTickets).fill('').map((_, index) => ({
        id: index + 1,
        email: savedIsBuyingForSelf && userEmail ? userEmail : ''
      }));
      setPassengers(initialPassengers);
      setIsBuyingForSelf(savedIsBuyingForSelf);
    }
  }, [numberOfTickets, savedPassengers.length, savedIsBuyingForSelf, userEmail]);

  // Lưu state khi có thay đổi
  useEffect(() => {
    if (passengers.length > 0 && onFormDataChange) {
      onFormDataChange(passengers, isBuyingForSelf);
    }
  }, [passengers, isBuyingForSelf]);

  // Notify parent component và validate khi passengers thay đổi
  useEffect(() => {
    if (passengers.length > 0) {
      if (onPassengerChange) {
        onPassengerChange(passengers);
      }
      validatePassengers(passengers);
    }
  }, [passengers]);

  const validatePassengers = (passengerList) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Validate all passengers
    passengerList.forEach((passenger, index) => {
      if (!passenger || !passenger.email || passenger.email.trim() === '') {
        if (index === 0) {
          errors[index] = 'Email là bắt buộc cho hành khách chính';
        } else {
          errors[index] = 'Email là bắt buộc';
        }
      } else if (!emailRegex.test(passenger.email)) {
        errors[index] = 'Email không hợp lệ';
      }
    });

    setValidationErrors(errors);
    
    // Notify parent component about validation status
    if (onValidationChange) {
      const isValid = Object.keys(errors).length === 0;
      onValidationChange(isValid);
    }
  };

  const handleEmailChange = (index, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      email: value
    };
    setPassengers(updatedPassengers);
    
    // Trigger validation ngay lập tức
    validatePassengers(updatedPassengers);
    
    // Notify parent component ngay lập tức
    if (onPassengerChange) {
      onPassengerChange(updatedPassengers);
    }
  };

  const handleModeChange = (e) => {
    const mode = e.target.checked;
    setIsBuyingForSelf(mode);
    const updatedPassengers = Array(numberOfTickets).fill('').map((_, index) => ({
      id: index + 1,
      email: mode && userEmail ? userEmail : ''
    }));
    setPassengers(updatedPassengers);
    
    // Trigger validation ngay lập tức
    validatePassengers(updatedPassengers);
    
    // Notify parent component ngay lập tức
    if (onPassengerChange) {
      onPassengerChange(updatedPassengers);
    }
  };

  return (
    <Card className="passenger-form-card shadow-sm border-0">
      <Card.Body className="p-4">
        <h4 className="mb-4 text-primary fw-bold">Thông tin hành khách</h4>
        
        <div className="booking-mode-section mb-4">
          <Form.Check 
            type="switch"
            id="booking-mode"
            label="Mua vé cho chính mình"
            checked={isBuyingForSelf}
            onChange={handleModeChange}
            className="custom-switch mb-3"
          />
          {isBuyingForSelf && (
            <div className="text-muted small mode-description">
              Email tài khoản của bạn sẽ được sử dụng cho tất cả vé
            </div>
          )}
        </div>

        <Form>
          {passengers.map((passenger, index) => (
            <div key={passenger.id} className="passenger-section mb-4">
              <div className="d-flex align-items-center mb-3">
                <h6 className="mb-0 text-muted fw-semibold">Hành khách {index + 1}</h6>
                {index === 0 && (
                  <span className="badge bg-primary ms-2 rounded-pill">Liên hệ chính</span>
                )}
              </div>
              
              <Row>
                <Col>
                  <Form.Group controlId={`email-${index}`}>
                    <Form.Label className="text-muted small">
                      Địa chỉ email
                      <span className="text-danger ms-1">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      required
                      placeholder="Nhập địa chỉ email"
                      value={passenger.email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      className={`form-control-custom ${validationErrors[index] ? 'is-invalid' : ''}`}
                      disabled={isBuyingForSelf}
                    />
                    {validationErrors[index] && (
                      <div className="invalid-feedback d-block">
                        {validationErrors[index]}
                      </div>
                    )}
                    {index === 0 && !validationErrors[index] && (
                      <Form.Text className="text-muted small">
                        Xác nhận đặt vé sẽ được gửi đến email này
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              
              {index < passengers.length - 1 && (
                <hr className="my-4" />
              )}
            </div>
          ))}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PassengerForm; 