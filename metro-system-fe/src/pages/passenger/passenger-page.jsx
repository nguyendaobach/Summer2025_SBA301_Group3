import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import PassengerForm from '../../components/passenger/PassengerForm';
// import PaymentMethodList from '../../components/passenger/PaymentMethodList';
import TicketSummary from '../../components/passenger/TicketSummary';
import { TicketContext } from '../../pages/layout/TicketLayout';
import PromotionInput from '../../components/promotion/PromotionInput';



const PassengerPage = ({ layoutCurrentStep, onStepChange }) => {
  const { singleForm, travelPassForm } = useContext(TicketContext);
  const [passengers, setPassengers] = useState([]);
  const [currentPassengerStep, setCurrentPassengerStep] = useState(1);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promotionCode, setPromotionCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  
  // State để lưu trữ thông tin form khi chuyển step
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [savedIsBuyingForSelf, setSavedIsBuyingForSelf] = useState(false);

  // Get user email from localStorage
  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handlePromotionApplied = (promotion) => {
    setAppliedPromotion(promotion);
  };

  const handlePromotionCodeChange = (code) => {
    setPromotionCode(code);
  };
  
  const handleFormValidChange = (isValid) => {
    setIsFormValid(isValid);
  };

  // Lưu thông tin form khi chuyển step
  const handlePassengerFormData = (passengerData, isBuyingForSelf) => {
    setSavedPassengers(passengerData);
    setSavedIsBuyingForSelf(isBuyingForSelf);
  };



  const renderStep = () => {
    switch (currentPassengerStep) {
      case 1:
        return <PassengerForm 
          numberOfTickets={singleForm?.numberOfTickets || travelPassForm?.numberOfTickets || 1}
          onPassengerChange={handlePassengerChange}
          userEmail={userEmail}
          onValidationChange={handleFormValidChange}
          savedPassengers={savedPassengers}
          savedIsBuyingForSelf={savedIsBuyingForSelf}
          onFormDataChange={handlePassengerFormData}
        />;
      case 2:
        return <PromotionInput
          ticketType={singleForm?.ticketTypeId || travelPassForm?.ticketTypeId}
          onPromotionApplied={handlePromotionApplied}
          promotionCode={promotionCode}
          onPromotionCodeChange={handlePromotionCodeChange}
        />;
    }
  };

  const handlePassengerChange = (updatedPassengers) => {
    setPassengers(updatedPassengers);
  };

  return (
    <Container className="py-4 mt-4">
      <Row>
        {/* Left Section */}
        <Col md={8}>
          <Card className="passenger-form-card mb-4">
            <Card.Header className="bg-white border-0">
              <h4 className="mb-0">
                <i className="bi bi-person-circle me-2 text-primary"></i>
                Thông tin hành khách
              </h4>
              <p className="text-muted small mb-0 mt-2">
                Vui lòng cung cấp địa chỉ email cho tất cả hành khách. Liên hệ chính sẽ nhận được xác nhận đặt vé.
              </p>
            </Card.Header>
            <Card.Body>
              {renderStep()}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Section - Ticket Summary */}
        <Col md={4}>
          <Card className="ticket-summary-card sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-white border-0">
              <h4 className="mb-0">
                <i className="bi bi-receipt me-2 text-primary"></i>
                Tóm tắt đặt vé
              </h4>
            </Card.Header>
            <Card.Body>
              <TicketSummary passengers={passengers}
                onNextStep={setCurrentPassengerStep}
                currentPassengerStep={currentPassengerStep}
                layoutCurrentStep={layoutCurrentStep}
                onStepChange={onStepChange}
                promotion={appliedPromotion}
                isFormValid={isFormValid}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PassengerPage;
