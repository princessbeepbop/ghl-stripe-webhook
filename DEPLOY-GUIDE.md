# 🚀 Deploy Your GHL → Stripe Webhook in 3 Minutes

Your webhook is ready to deploy. Here's how:

## Step 1: Create GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it: `ghl-stripe-webhook`
3. Keep it **Public** (for Vercel to access)
4. Click **Create repository**

## Step 2: Upload Files to GitHub

Clone the repo locally, then add these files:

```
ghl-stripe-webhook/
├── api/
│   └── webhook.js
├── package.json
├── vercel.json
├── .gitignore
├── .env.example
└── README.md
```

Push to GitHub:
```bash
git add .
git commit -m "Initial commit: GHL to Stripe webhook"
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import from GitHub** → Select your `ghl-stripe-webhook` repo
3. Click **Import**
4. Under **Environment Variables**, add:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `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`
5. Click **Deploy**

⏳ **Wait 1-2 minutes for deployment...**

## Step 4: Get Your Webhook URL

After deployment completes:
1. Click the **Deployment** link
2. Copy the URL (should be something like `https://ghl-stripe-webhook.vercel.app`)
3. Your webhook endpoint is: `https://ghl-stripe-webhook.vercel.app/api/webhook`

## Step 5: Set GHL Webhook

In **GoHighLevel**:

1. Go to your **Booking/Form** that collects notarization requests
2. Find **Automations** or **Webhook** settings
3. Add a new webhook:
   - **URL:** `https://ghl-stripe-webhook.vercel.app/api/webhook` (your actual URL)
   - **Method:** `POST`
   - **Trigger:** Form Submission
   - **Auth:** None needed

4. Save

## Step 6: Test It

Send a test submission through your GHL form, then:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Customers**
3. Find the customer by email (escrow officer's email)
4. Click their name
5. You should see a new **Invoice** (status: Draft)
6. Click the invoice to view the memo with all details

✅ **Done!**

---

## 📝 GHL Form Field Mapping

The webhook expects these field names in your GHL form:

| What It's For | GHL Field Name | Example |
|---|---|---|
| Escrow Officer Name | `Escrow Officer/Attorney making request: Name` | Rafael Morales |
| Escrow Officer Email | `Escrow Officer/Attorney Email` | rafael@llgtitle.com |
| Escrow Officer Phone | `Escrow Officer/Attorney Phone` | (954) 673-7997 |
| Signer Name | `Signer 1 Name` | Joao Victor Sperle Da Silva |
| Signer Email | `Signer 1 Email` | jvsperle@hotmail.com |
| File Number | `File/Reference Number` | Sperle Da Silva QCD |
| Property Address | `Property Address` | 5542 Metrowest Blvd, Apt 107, Orlando, FL 32811 |
| Fee | `fee` | 150 |
| Closing Type | `closing_type` | Single Notarization (QCD) |

**⚠️ If your GHL field names are different**, let me know and I'll update the webhook.

---

## 📧 Invoice Memo (What Appears in Stripe)

```
Notarization for: Joao Victor Sperle Da Silva
File No: Sperle Da Silva QCD
Property Address: 5542 Metrowest Blvd, Apt 107, Orlando, FL 32811
Submitted by: Rafael Morales
wait for review
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| "Email is required" error | GHL form not sending Escrow Officer email field |
| Invoice not appearing | Check Vercel logs: Project → Logs → Function Logs |
| Wrong customer created | Check email matching in webhook code |
| Stripe key error | Verify `STRIPE_SECRET_KEY` env var in Vercel settings |

---

## Need the Files?

All files are in `/mnt/user-data/outputs/`:
- `webhook.js`
- `package.json`
- `README.md`

Download and push to GitHub to deploy.

