import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import './PromotionInput.scss';
import axiosInstance from '../../config/axios';

const PromotionInput = ({ ticketType,
    onPromotionApplied,
    promotionCode: initialPromotionCode,
    onPromotionCodeChange
}) => {
    const [promotionCode, setPromotionCode] = useState(initialPromotionCode || '');
    const [isValid, setIsValid] = useState(true);
    const [showPromotions, setShowPromotions] = useState(false);
    const [availablePromotions, setAvailablePromotions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Update local state when prop changes
    useEffect(() => {
        setPromotionCode(initialPromotionCode || '');
    }, [initialPromotionCode]);

    // Auto-apply promotion when component mounts with existing code
    useEffect(() => {
        if (initialPromotionCode && initialPromotionCode.trim() !== '') {
            applyPromotion(initialPromotionCode);
        }
    }, []); // Only run once on mount

    // Fetch promotions when component mounts or ticketType changes
    useEffect(() => {
        if (ticketType) {
            fetchPromotions();
        }
    }, [ticketType]);

    const fetchPromotions = async () => {
        if (!ticketType) return;
        
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/promotions/get?ticketTypeId=${ticketType}`);
            if (response.status === 200 && response.data.data) {
                setAvailablePromotions(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
            setAvailablePromotions([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePromotionChange = (e) => {
        const value = e.target.value.toUpperCase();
        setPromotionCode(value);
        onPromotionCodeChange(value);
        setIsValid(true);
        if (!value) {
            onPromotionApplied(null);
        }
    };

    const applyPromotion = async (code) => {
        if (!code) {
            onPromotionApplied(null);
            setIsValid(true);
            return;
        }
        try {
            const response = await axiosInstance.get('/promotions/active', { params: { code, ticketTypeId: ticketType } });
            if (response.status === 200 && response.data) {
                setIsValid(true);
                onPromotionApplied(response.data.data);
            } else {
                setIsValid(false);
                onPromotionApplied(null);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Invalid promotion code');
            setIsValid(false);
            onPromotionApplied(null);
        }
    };

    const handleApply = (promotionCode) => {
        setPromotionCode(promotionCode);
        applyPromotion(promotionCode);
    };

    const handlePromotionSelect = (promotion) => {
        if (promotion.status === 'INACTIVE') {
            return; // Don't allow selection of inactive promotions
        }
        setPromotionCode(promotion.promotionCode);
        onPromotionCodeChange(promotion.promotionCode);
        setIsValid(true);
        applyPromotion(promotion.promotionCode);
    };

    return (
        <div className="promotion-input">
            <div className="promotion-wrapper">
                <div className="promotion-header">
                    <h3>Mã khuyến mãi</h3>
                </div>
                <div className="promotion-body">
                    <div className="input-group">
                        <Form.Control
                            type="text"
                            placeholder="Nhập mã khuyến mãi"
                            value={promotionCode}
                            onChange={handlePromotionChange}
                            className={!isValid ? 'is-invalid' : ''}
                        />
                        <button
                            className="apply-btn"
                            onClick={() => handleApply(promotionCode)}
                        >
                            Áp dụng
                        </button>
                    </div>
                    {!isValid && (
                        <div className="error-message">
                            Vui lòng nhập mã khuyến mãi hợp lệ
                        </div>
                    )}

                    <div className="available-promotions">
                        <div
                            className="promotions-toggle"
                            onClick={() => setShowPromotions(!showPromotions)}
                        >
                            <span>Mã khuyến mãi</span>
                            <i className={`fas fa-chevron-${showPromotions ? 'up' : 'down'}`}></i>
                        </div>

                        {showPromotions && (
                            <div className="promotions-list">
                                {loading ? (
                                    <div className="loading-message">Đang tải mã khuyến mãi...</div>
                                ) : availablePromotions.length > 0 ? (
                                    availablePromotions.map((promo, index) => (
                                        <div
                                            key={promo.promotionId}
                                            className={`promotion-item ${promo.status === 'INACTIVE' ? 'inactive' : ''}`}
                                            onClick={() => handlePromotionSelect(promo)}
                                        >
                                            <div className="promo-code">{promo.promotionCode}</div>
                                            <div className="promo-details">
                                                <div className="promo-discount">{promo.promotionDiscount}% off</div>
                                                <div className="promo-description">{promo.promotionName}</div>
                                                {promo.status === 'INACTIVE' && (
                                                    <div className="promo-status inactive">Inactive</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-promotions">Không có mã khuyến mãi</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionInput; 