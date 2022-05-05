// const twilio = require("../../Sms helpers/twilio");

const twilio = require("../../Sms helpers/twilio");
const sms = async (phone, message) => {
  console.log(`message: ${message},number: ${phone}`);
  return twilio.messages.create({
    from: "+12764008735",
    to: phone,
    body: message,
  });
};
module.exports = sms;
