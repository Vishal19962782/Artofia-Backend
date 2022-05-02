const Events = require("../models/Events");

exports.AddEvent = async (req, res) => {
  console.log(req.file);
  const obj = {
    eventName: req.body.eventName,
    eventOwner: req.headers.user,
    noOfTickets: req.body.noOfTickets,
    eventDate: req.body.eventDate,
    eventAddress: req.body.eventAddress,
    // contactNumber: req.body.contactNumber,
    ticketPrice: req.body.ticketPrice,
    eventDescription: req.body.eventDescription,
    eventImage: req.file.path,
    eventBrief: req.body.eventBrief,
  };
  const event = await Events.create(obj);
  console.log(event);
  res.send(event);
};
exports.getEvents = async ( req, res) => {
  const events = await Events.find().populate("eventOwner", "_id fname lname avatar");
  res.send(events);
};
