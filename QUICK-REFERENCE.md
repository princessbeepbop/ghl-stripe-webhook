# ⚡ Quick Reference Card

## Your Webhook Details

**Webhook Function:** GHL Form → Stripe Customer & Invoice

**Stripe Secret Key (Already Set):** 
```
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
```

---

## Deployment Checklist

- [ ] Create GitHub repo: `ghl-stripe-webhook`
- [ ] Upload these files to GitHub:
  - `api/webhook.js`
  - `package.json`
  - `vercel.json`
  - `.gitignore`
  - `.env.example`
  - `README.md`
- [ ] Go to vercel.com/new
- [ ] Import GitHub repo
- [ ] Add env var: `STRIPE_SECRET_KEY` = `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`
- [ ] Deploy (takes 1-2 min)
- [ ] Copy webhook URL: `https://your-project.vercel.app/api/webhook`
- [ ] Add to GHL form webhook settings
- [ ] Test with GHL form submission
- [ ] Check Stripe dashboard for new invoice

---

## GHL Form Field Names (Must Match!)

Your webhook looks for these exact field names:

```
Escrow Officer/Attorney making request: Name
Escrow Officer/Attorney Email
Escrow Officer/Attorney Phone
Company Name
Signer 1 Name
Signer 1 Email
File/Reference Number
Property Address
fee
closing_type
```

**If your GHL fields are named differently**, let me know and I'll update the webhook.

---

## What Happens When Form is Submitted

1. ✅ GHL sends form data to webhook
2. ✅ Webhook searches Stripe for customer by email
3. ✅ If not found → creates new customer
4. ✅ Creates **DRAFT** invoice with memo:
   ```
   Company: [Company Name]
   Notarization for: [Signer 1 Name]
   File No: [File/Reference Number]
   Property Address: [Property Address]
   Submitted by: [Escrow Officer Name]
   wait for review
   ```
5. ✅ Returns invoice link to GHL (optional)

---

## Invoice Details in Stripe

- **Customer Name:** Company Name (where invoice goes)
- **Customer Email:** Escrow Officer Email
- **Invoice Description:** `RON - [File/Reference Number]`
- **Line Item:** `[closing_type]` (e.g., "Single Notarization (QCD)")
- **Amount:** Whatever is in `fee` field (default $150)
- **Custom Field (Memo):** Full notarization details including company name + "wait for review"
- **Status:** DRAFT (you review before sending)

---

## Testing

### Manual Test with cURL:
```bash
curl -X POST https://your-project.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Escrow Officer/Attorney making request: Name": "Rafael Morales",
    "Escrow Officer/Attorney Email": "rafael@llgtitle.com",
    "Escrow Officer/Attorney Phone": "(954) 673-7997",
    "Company Name": "LLG Title",
    "Signer 1 Name": "Joao Victor Sperle Da Silva",
    "Signer 1 Email": "jvsperle@hotmail.com",
    "File/Reference Number": "Sperle Da Silva QCD",
    "Property Address": "5542 Metrowest Blvd, Apt 107, Orlando, FL 32811",
    "fee": 150,
    "closing_type": "Single Notarization (QCD)"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "invoice": {
    "id": "in_xxxxx",
    "customerId": "cus_xxxxx",
    "amount": 15000,
    "status": "draft",
    "link": "https://invoice.stripe.com/..."
  }
}
```

---

## Vercel Logs

If something breaks:
1. Go to [vercel.com](https://vercel.com)
2. Click your project: `ghl-stripe-webhook`
3. Click **Deployments** tab
4. Click the latest deployment
5. Click **Functions** → **api/webhook**
6. Scroll down to see error logs

---

## Need to Modify the Webhook?

Common customizations:

### Auto-Send Invoice Email
In webhook.js, before the return statement:
```javascript
await stripe.invoices.sendInvoice(finalizedInvoice.id);
```

### Different Fee Amounts by Closing Type
```javascript
const feeMap = {
  'qcd': 150,
  'poa': 130,
  'marriage_license': 200,
};
```

### Add Slack Notification
Send message to Slack when invoice created (requires Slack webhook URL)

---

## Questions?

**Check these first:**
1. Did GHL form submit successfully?
2. Check Vercel logs for errors
3. Verify Stripe secret key is correct
4. Confirm GHL field names match webhook expectations
