const express = require("express");
const app = express();
var cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

require("dotenv").config();

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fiojy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    console.log("db connect");
    const productCollection = client.db("gadgetFreak").collection("products");
    const orderCollection = client.db("gadgetFreak").collection("orders");

    app.post("/login", async (req, res) => {
      const email = req.body;
      console.log(email);
      const token = jwt.sign(email, process.env.ACCESS_KEY);
      console.log(token);
      res.send({ token });
    });

    app.get("/products", async (req, res) => {
      const products = await productCollection.find({}).toArray();
      res.send(products);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    // update user
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      console.log(updatedProduct.quantity);
      console.log(typeof updatedProduct.quantity);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          // name: updatedProduct.name,
          // email: updatedProduct.email,
          quantity: updatedProduct.quantity,
          // price: updatedProduct.price,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.post("/uploadPd", async (req, res) => {
      const product = req.body;
      // console.log(product);
      const tokeninfo = req.headers.authorization;
      // console.log(tokeninfo);

      const [email, accessToken] = tokeninfo?.split(" ");
      console.log(accessToken);
      const decoded = verifyToken(accessToken);

      console.log(email, decoded);
      if (email === decoded.email) {
        const result = await productCollection.insertOne(product);
        res.send({ success: "Product Upload Successfully" });
      } else {
        res.send({ success: "unAuthorize" });
      }
    });

    app.post("/productorder", async (req, res) => {
      const orderin = req.body;
      // console.log(product);
      const tokeninfo = req.headers.authorization;

      const [email, accessToken] = tokeninfo?.split(" ");
      console.log(accessToken);
      const decoded = verifyToken(accessToken);
      if (email === decoded.email) {
        const result = await orderCollection.insertOne(orderin);
        res.send({ success: "Order Upload Successfully" });
      } else {
        res.send({ success: "unAuthorize order" });
      }
    });

    app.get("/useraddlist", async (req, res) => {
      adduser = req.body;

      const tokeninfo = req.headers.authorization;

      const [email, accessToken] = tokeninfo?.split(" ");
      console.log(accessToken, adduser);
      const decoded = verifyToken(accessToken);

      if (email === decoded.email) {
        const orders = await productCollection.find((email = email)).toArray();
        res.send(orders);
      } else {
        res.send({ success: "unAuthorize order name" });
      }
    });

    // DELETE
    app.delete("/manageinventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_KEY, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      console.log(decoded);
      email = decoded;
    }
  });
  return email;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
