const twilio=require('twilio');
const accountSid = 'ACb6d16ead3d036b7334a32a89619f8a6e';
const authToken = '1c0aead40b2f116e234fac1ee8d45549';

const client = new twilio(accountSid, authToken);
module.exports=client;