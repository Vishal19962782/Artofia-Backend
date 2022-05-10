// const twilio = require("../../Sms helpers/twilio");

const twilio = require("../../Sms helpers/twilio");
const sms = async (phone, message) => {
  console.log(`message: ${message},number: ${phone}`);
  return twilio.services.creates("VA81fc14b80c335c6e7dfa8c0e117df26a")
    .verifications
    .create({ to: "+917012570964", channel: "sms" })
    .then(verification =>console.log(verification.status))
  // return twilio.verify.create("VA81fc14b80c335c6e7dfa8c0e117df26a")
  // .verifications
  // .create({to: phone, channel: 'sms'})
  // .then(verification => console.log(verification.status));
  // //   from: "+12764008735",
  // //   to: phone,
  // //   body: message,
  // // });
};
module.exports = sms;
