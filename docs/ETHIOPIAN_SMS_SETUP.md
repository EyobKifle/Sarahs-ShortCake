# Ethiopian SMS Integration Guide

This guide explains how to set up SMS notifications for Ethiopian customers using local SMS providers.

## Supported SMS Providers

### 1. Ethiopia Telecom
- **Coverage**: Nationwide
- **Cost**: Low (local rates)
- **Best for**: Local Ethiopian customers
- **Setup Requirements**: API key from Ethiopia Telecom

### 2. Safaricom Ethiopia
- **Coverage**: Major cities and urban areas
- **Cost**: Medium
- **Best for**: Urban customers
- **Setup Requirements**: Business account with Safaricom Ethiopia

### 3. Local SMS Gateway
- **Coverage**: Depends on gateway provider
- **Cost**: Variable
- **Best for**: Custom integrations
- **Setup Requirements**: Local SMS gateway service

### 4. Twilio (International)
- **Coverage**: International
- **Cost**: Higher (international rates)
- **Best for**: International customers or backup
- **Setup Requirements**: Twilio account

## Ethiopian Phone Number Format

Ethiopian phone numbers follow these patterns:

### Mobile Numbers
- **Format**: +251 9XX XXX XXX
- **Examples**: 
  - +251 911 123456 (Ethio Telecom)
  - +251 961 123456 (Safaricom Ethiopia)

### Landline Numbers
- **Format**: +251 11X XXX XXX
- **Example**: +251 115 123456

### Carrier Identification
- **91X, 92X, 93X, 94X**: Ethio Telecom mobile
- **96X, 97X**: Safaricom Ethiopia mobile
- **11X**: Landline (Ethio Telecom)

## Setup Instructions

### Ethiopia Telecom Setup

1. **Get API Credentials**
   - Contact Ethiopia Telecom business services
   - Request SMS API access
   - Obtain API key and sender ID

2. **Configure in Admin Panel**
   - Go to Settings → SMS Configuration
   - Select "Ethiopia Telecom" as provider
   - Enter your API key
   - Set sender ID (e.g., "SARAHS")
   - Set API URL (usually provided by Ethiopia Telecom)

3. **Test Configuration**
   - Click "Test SMS" button
   - Enter a test Ethiopian phone number
   - Verify SMS delivery

### Safaricom Ethiopia Setup

1. **Business Account**
   - Open business account with Safaricom Ethiopia
   - Request SMS service activation
   - Obtain username, password, and short code

2. **Configure in Admin Panel**
   - Select "Safaricom Ethiopia" as provider
   - Enter username and password
   - Set short code

3. **Test Configuration**
   - Use test SMS feature
   - Verify delivery to Safaricom numbers

### Local Gateway Setup

1. **Gateway Service**
   - Set up or subscribe to local SMS gateway
   - Obtain gateway URL and API key
   - Ensure gateway supports Ethiopian networks

2. **Configure in Admin Panel**
   - Select "Local SMS Gateway" as provider
   - Enter gateway URL
   - Set API key

### Twilio Setup (Backup/International)

1. **Twilio Account**
   - Create account at twilio.com
   - Verify your business
   - Purchase phone number

2. **Configure in Admin Panel**
   - Select "Twilio" as provider
   - Enter Account SID and Auth Token
   - Set from number

## SMS Message Types

The system sends these types of SMS messages:

### Order Notifications
- Order confirmation
- Order status updates
- Order ready for pickup
- Order completion

### Inventory Alerts
- Low stock notifications (to admin)
- Restock reminders

### System Alerts
- New order alerts (to admin)
- System maintenance notifications

## Best Practices

### Phone Number Validation
- Always validate Ethiopian phone numbers
- Support both local and international formats
- Provide clear format examples to users

### Message Content
- Keep messages concise (160 characters max)
- Use clear, simple language
- Include business name for identification
- Add opt-out instructions for marketing messages

### Cost Optimization
- Use local providers for Ethiopian numbers
- Implement message queuing for bulk sends
- Monitor delivery rates and costs
- Set up fallback providers

### Compliance
- Follow Ethiopian telecommunications regulations
- Respect customer privacy preferences
- Implement opt-in/opt-out mechanisms
- Keep message logs for compliance

## Troubleshooting

### Common Issues

1. **SMS Not Delivered**
   - Check phone number format
   - Verify provider credentials
   - Check network connectivity
   - Review provider status

2. **Invalid Phone Number**
   - Ensure correct Ethiopian format
   - Remove spaces and special characters
   - Verify country code (+251)

3. **Provider Authentication Failed**
   - Double-check API credentials
   - Verify account status with provider
   - Check for expired tokens/passwords

4. **High Costs**
   - Review message content length
   - Optimize sending frequency
   - Use local providers for local numbers
   - Implement message batching

### Error Codes

- **401**: Authentication failed
- **403**: Insufficient credits/permissions
- **404**: Invalid endpoint/number
- **429**: Rate limit exceeded
- **500**: Provider server error

## Testing

### Test Scenarios
1. Send to Ethio Telecom number (09XX XXX XXX)
2. Send to Safaricom number (096X XXX XXX)
3. Send to landline number (011X XXX XXX)
4. Test with international format (+251...)
5. Test with local format (09XX...)

### Test Numbers
Use these test numbers for development:
- +251 911 000001 (Ethio Telecom test)
- +251 961 000001 (Safaricom test)

## Support

### Ethiopia Telecom
- Business Support: +251 115 000000
- Email: business@ethiotelecom.et
- Website: ethiotelecom.et

### Safaricom Ethiopia
- Business Support: +251 961 000000
- Email: business@safaricom.et
- Website: safaricom.et

### Technical Support
For technical issues with the SMS integration:
1. Check system logs in admin panel
2. Verify provider status pages
3. Test with different phone numbers
4. Contact your SMS provider support

## Security

### API Key Protection
- Store API keys securely
- Use environment variables in production
- Rotate keys regularly
- Monitor for unauthorized usage

### Message Security
- Don't send sensitive information via SMS
- Use HTTPS for all API calls
- Implement rate limiting
- Log all SMS activities

## Monitoring

### Key Metrics
- Delivery rate by provider
- Message costs
- Response times
- Error rates
- Customer engagement

### Alerts
Set up alerts for:
- Failed deliveries
- High error rates
- Unusual costs
- Provider downtime

This completes the Ethiopian SMS integration setup. For additional support, refer to your SMS provider's documentation or contact their business support teams.
