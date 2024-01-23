//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const { MongoClient } = require('mongodb');
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect(process.env.DATA_BASE);
const PORT = process.env.PORT || 3000;


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATA_BASE);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Handle the error appropriately, such as sending an error response to the client
    // res.status(500).send("Internal Server Error");
    process.exit(1); // Consider whether to exit the process or not
  }
}





const itemSchema = new mongoose.Schema({
  value: String
});
const Items = mongoose.model("Items", itemSchema);

const listSchema = new mongoose.Schema({
  name: String,
  listItems: [itemSchema]
});
const List = mongoose.model("List", listSchema);

const item1 = new Items({
  value: "Welcome To Todo List"
});

const item2 = new Items({
  value: "Click + to add new item"
});

const item3 = new Items({
  value: "<- select to delete item"
});

const defaultItems = [item1, item2, item3];
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];


app.get("/", function (req, res) {

  // const day = date.getDate();
  const day = "Today";

  Items.find().maxTimeMS(15000)
  .then((e) => {
    if (e.length === 0) {
      Items.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: e });
    }
  })
  .catch((error) => {
    console.error("Error fetching items:", error);
    // Handle the error appropriately, such as sending an error response to the client
    res.status(500).send("Internal Server Error");
  });



});

app.post("/", function (req, res) {
  const itemValue = req.body.newItem;
  const listName = req.body.list


  const item = new Items({
    value: itemValue
  });


  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((e) => {
      e.listItems.push(item);
      e.save();
      res.redirect("/" + listName);
    });
  }


});


app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listName = req.body.list;
  console.log(listName);

  if (listName === "Today") {
    Items.findByIdAndDelete(id).then((e) => {
      res.redirect("/");
    });
  } else {

    List.findOneAndUpdate({ name: listName }, { $pull: { listItems: { _id: id } } }).then((e) => {
      e.save();
      res.redirect("/" + listName);
    })

  }

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);


  let isExit = false;

  List.find().maxTimeMS(15000).then((e) => {
    e.forEach(element => {
      if (element.name == customListName) {
        isExit = true;
      }
    });

    if (!isExit) {
      const list = new List({
        name: customListName,
        listItems: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {

      List.find({ name: customListName }).maxTimeMS(15000).then((e) => {
        e.forEach(element => {
          res.render("list", { listTitle: element.name, newListItems: element.listItems });
        });

      });
    }

  });


});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });

connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})
