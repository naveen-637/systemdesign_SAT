from pydantic import BaseModel, Field

class PaymentCreateRequest(BaseModel):
    rideId: str = Field(..., min_length=1, description="Target ride identifier")
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    paymentMethod: str = Field(default="UPI", description="Payment method: UPI, CARD, CASH, WALLET")

class PaymentResponse(BaseModel):
    id: str
    rideId: str
    amount: float
    paymentMethod: str
    paymentStatus: str
    transactionReference: str
    createdAt: str
    message: str
