const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function parseGHLForm(body) {
  return {
    contactName: body['Escrow Officer/Attorney making request: Name'] || body.escrow_officer_name || '',
    email: body['Escrow Officer/Attorney Email'] || body.escrow_officer_email || '',
    phone: body['Escrow Officer/Attorney Phone'] || body.escrow_officer_phone || '',
    companyName: body['Company Name'] || body.company_name || '',
    signerName: body['Signer 1 Name'] || body.signer_1_name || '',
    signerEmail: body['Signer 1 Email'] || body.signer_1_email || '',
    referenceNumber: body['File/Reference Number'] || body.file_reference_number || '',
    propertyAddress: body['Property Address'] || body.property_address || '',
    fee: parseFloat(body.fee) || 150,
    closingType: body.closing_type || 'Remote Online Notarization',
  };
}

function buildMemo(data) {
  return `Company: ${data.companyName || 'N/A'}
Notarization for: ${data.signerName || 'N/A'}
File No: ${data.referenceNumber}
Property Address: ${data.propertyAddress}
Submitted by: ${data.contactName}
wait for review`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = parseGHLForm(req.body);

    const customerEmail = data.email || data.signerEmail;
    
    if (!customerEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: data.companyName || data.contactName || data.signerName,
        phone: data.phone,
        description: `Escrow Officer: ${data.contactName} | Signer: ${data.signerName} | Company: ${data.companyName}`,
      });
    }

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      description: `RON - ${data.referenceNumber}`,
      metadata: {
        ghl_reference: data.referenceNumber,
        property_address: data.propertyAddress,
        closing_type: data.closingType,
        company_name: data.companyName,
      },
    });

    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      description: data.closingType,
      amount: Math.round(data.fee * 100),
    });

    const finalizedInvoice = await stripe.invoices.update(invoice.id, {
      description: `RON - ${data.referenceNumber}`,
      custom_fields: [
        {
          name: 'Notarization Details',
          value: buildMemo(data),
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        id: finalizedInvoice.id,
        customerId: customer.id,
        amount: Math.round(data.fee * 100),
        status: finalizedInvoice.status,
        link: finalizedInvoice.hosted_invoice_url,
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: error.message,
      type: error.type,
    });
  }
};
