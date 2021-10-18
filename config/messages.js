module.exports = {
  SUCCESSFUL_SUBSCRIPTION: (amount, currency, subject, dueDate) => `
Namaskaram,

Thank you for your payment of ${amount} ${currency.toUpperCase()}.  You have successfully registered for ${subject} regular classes. We request you to attend all the classes as per the schedule given in https://mylivesloka.com. Your next payment due date is on ${dueDate}. We once again welcome you to Live Sloka Family!

Regards
Live Sloka Team`,

  UNSUCCESSFUL_SUBSCRIPTION: (amount, currency, subject) => `
Namaskaram,

We are sorry to inform you that we have not received your payment of ${amount} ${currency.toUpperCase()} for  ${subject} regular classes. Kindly contact the merchant if any amount has been debited from your account. Thank you for choosing Live Sloka as your online learning partner. We request you to contact our team via our Live Sloka chat box for any further assistance.

Regards
Live Sloka Team`,

  SUCCESSFUL_TRANSACTION: (amount, currency, subject, dueDate) => `
Namaskaram,

We have received an amount of ${amount} ${currency.toUpperCase()} for ${subject} regular classes. We wholeheartedly thank you for your continues trust in Live Sloka platform for your online learning. We request you to kindly attend all the classes as per schedule given in https://mylivesloka.com your next payment due date is on ${dueDate}.

Regards
Live Sloka Team`,

  UNSUCCESSFUL_TRANSACTION: (amount, currency, subject) => `
Namaskaram,

We are sorry to inform you that we have not received your payment of ${amount} ${currency.toUpperCase()} for ${subject} regular classes on ${startDate}. Hence your subscription stands cancelled and you would not be able to attend further classes. Kindly complete the payment as soon as possible to continue your learning journey. Thank you for choosing Live Sloka as your online learning partner. We request you to contact our team via our Live Sloka chat box for any further assistance.

Regards
Live Sloka Team`,

  PAYMENT_REMINDER: (dueDate) => `
Namaskaram,

Kindly note that your next payment due date is on ${dueDate}. We request you to complete the payment before the subscription period ends to have uninterrupted learning. Thank you for choosing Live Sloka as your online learning partner. We request you to contact our team via our Live Sloka chat box for any further assistance.

Regards
Live Sloka Team
`,

  ADMIN_PAYMENT_SUCCESSFUL: (amount, currency, subject, customer, dueDate) => `
Dear Admin,

You have successfully received a payment of ${amount} ${currency.toUpperCase()}  for ${subject} regular classes from Mr/Mrs ${customer}.  Their next payment due date is on ${dueDate}. 

Regards 
Your CRM
`,

  SUCCESSFUL_DEMO_SCHEDULE: (
    customer,
    phone,
    subject,
    teacher,
    dateWithTime
  ) => `
Dear Admin,

Mr./Mrs ${customer} with contact number ${phone} has successfully booked a demo class for ${subject} with ${teacher} Teacher on ${dateWithTime}.

Regards
Your CRM
`,

  ADMIN_PAYMENT_UNSUCCESSFUL: (
    customer,
    dateTime,
    amount,
    currency,
    subject,
    dueDate,
    phone
  ) => `
Dear Admin,

Payment attempt from Mr/Mrs ${customer} at ${dateTime} of ${amount} ${currency.toUpperCase()} has failed for ${subject} regular classes. Kindly follow up before their due date, which is on ${dueDate}. Their contact number is ${phone}

Regards
Your CRM`,

  ADMIN_UNSUBSCRIBE: (customer, dateTime, amount, currency, dueDate, phone) => `
Dear Admin,

Mr/Mrs ${customer} at ${dateTime} has unsubscribed an amount of ${amount} ${currency.toUpperCase()} for ${subject} regular classes. Kindly follow up before their due date, which is on ${dueDate}. Their contact number is ${phone}

Regards
Your CRM
`,
};
