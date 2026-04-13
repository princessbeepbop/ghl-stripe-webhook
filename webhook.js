const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map GHL form field names to our data structure
function parseGHLForm(body) {
  return {
    // Contact Info - "Escrow Officer/Attorney making request: Name"
    contactName: body.escrow_officer_name || body['Escrow Officer/Attorney making request: Name'] || '',
    email: body.escrow_officer_email || body['Escrow Officer/Attorney Email'] || '',
    phone: body.escrow_officer_phone || body['Escrow Officer/Attorney Phone'] || '',
    
    // Company Name - Where invoice goes
    companyName: body.company_name || body['Company Name'] || '',
    
    // Signer Info - "Signer 1 Name"
    signerName: body.signer_1_name || body['Signer 1 Name'] || '',
    signerEmail: body.signer_1_email || body['Signer 1 Email'] || '',
    
    // Booking Details - "File/Reference Number" and "Property Address"
    referenceNumber: body.file_reference_number || body['File/Reference Number'] || '',
    propertyAddress: body.property_address || body['Property Address'] || '',
    
    // Fee (in dollars, we'll convert to cents)
    fee: parseFloat(body.fee) || 150,
    
    // Line item description (the closing type)
    closingType: body.closing_type || 'Remote Online Notarization',
  };
}

// Build the memo string
function buildMemo(data) {
  return `Company: ${data.companyName || 'N/A'}
Notarization for: ${data.signerName || 'N/A'}
File No: ${data.referenceNumber}
Property Address: ${data.propertyAddress}
Submitted by: ${data.contactName}
wait for review`;
}

module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = parseGHLForm(req.body);

    // Validate required fields
    if (!data.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Step 1: Find or create customer in Stripe
    let customer;
    const customerEmail = data.email || data.signerEmail;
    
    if (!customerEmail) {
      return res.status(400).json({ error: 'Email (escrow officer or signer) is required' });
    }
    
    // Search for existing customer by email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new customer (use escrow officer if available, else signer)
      customer = await stripe.customers.create({
        email: customerEmail,
        name: data.companyName || data.contactName || data.signerName,
        phone: data.phone,
        description: `Escrow Officer: ${data.contactName} | Signer: ${data.signerName} | Company: ${data.companyName}`,
      });
    }

    // Step 2: Create draft invoice
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

    // Step 3: Add line item to invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      description: data.closingType,
      amount: Math.round(data.fee * 100), // Convert dollars to cents
    });

    // Step 4: Finalize the invoice (convert to draft status)
    const finalizedInvoice = await stripe.invoices.update(invoice.id, {
      description: `RON - ${data.referenceNumber}`,
      custom_fields: [
        {
          name: 'Notarization Details',
          value: buildMemo(data),
        },
      ],
    });

    // Return success response
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
}        email: customerEmail,
        name: data.companyName || data.contactName || data.signerName,
        phone: data.phone,
        description: `Escrow Officer: ${data.contactName} | Signer: ${data.signerName} | Company: ${data.companyName}`,
      });
    }

    // Step 2: Create draft invoice
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

    // Step 3: Add line item to invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      description: data.closingType,
      amount: Math.round(data.fee * 100), // Convert dollars to cents
    });

    // Step 4: Finalize the invoice (convert to draft status)
    const finalizedInvoice = await stripe.invoices.update(invoice.id, {
      description: `RON - ${data.referenceNumber}`,
      custom_fields: [
        {
          name: 'Notarization Details',
          value: buildMemo(data),
        },
      ],
    });

    // Return success response
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
}
