# Autumn Pricing Integration

This document outlines the pricing integration implemented for the LLMScore application.

## Pricing Structure

### Credit Packages
- **Starter Pack**: $5.00 USD = 1 credit
- **Growth Pack**: $20.00 USD = 5 credits (saves $5.00)  
- **Pro Pack**: $50.00 USD = 15 credits (saves $25.00)

### Scan Costs
- **Basic Scan**: 1 credit per scan (includes website map, AI files check, and evaluation)
- **Premium Scan**: 3 credits per scan (coming soon - advanced features)

## Implementation Details

### Database Schema
- `user_credits`: Stores user credit balances and totals
- `credit_transactions`: Records all purchases and consumption
- Updated existing tables to track credits consumed per scan

### API Endpoints
- `GET /api/credits`: Get user credit balance, stats, and pricing info
- `POST /api/credits`: Purchase credit packages (mock implementation)
- `GET /api/credits/transactions`: Get transaction history

### Credit Consumption
All scan operations now consume credits:
- `/api/evaluate`: Consumes credits for evaluation scans
- `/api/map`: Consumes credits for website mapping
- `/api/check-files`: Consumes credits for AI file checks

### Frontend Components
- `CreditsDisplay`: Shows current balance in header
- `PricingPage`: Credit purchase interface
- Insufficient credits handling with purchase prompts
- Dashboard integration showing credit stats

### Features Implemented
✅ Credit balance tracking  
✅ Automatic credit consumption  
✅ Insufficient credit validation  
✅ Purchase flow (demo implementation)  
✅ Transaction history  
✅ Credit usage statistics  
✅ Low balance warnings  
✅ Pricing tiers with bulk discounts  

### Future Premium Features (Coming Soon)
- Premium scans with SEO suggestions
- LLM text generation capabilities  
- LLM text quality checking
- Advanced analytics and reporting
- Priority support

## Usage Flow

1. User signs up and starts with 0 credits
2. User attempts to scan a website
3. System checks if user has sufficient credits (1 credit for basic scan)
4. If insufficient, user is prompted to purchase credits
5. User selects a credit package and completes purchase
6. Credits are added to account and scan proceeds
7. Credits are consumed upon successful scan completion
8. User can view credit history and stats in dashboard

## Payment Integration

Currently implemented as a demo with mock payment processing. To integrate with real payment processors:

1. Replace mock payment in `/api/credits` POST endpoint
2. Integrate with Stripe, PayPal, or similar service
3. Add proper error handling for payment failures
4. Implement webhooks for payment confirmation
5. Add refund capabilities

## Security Considerations

- Credit consumption happens after successful API calls to prevent abuse
- All credit operations are server-side only
- User authentication required for all credit-related operations
- Transaction logging for audit purposes