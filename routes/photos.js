const express = require("express");
const router = express.Router();

const multer = require("multer");
const aws = require("aws-sdk");
const path = require("path");
const { v4: uuserIDv4 } = require("uuserID");

const Photo = mongoose.model("Photo", photoSchema);

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/upload", upload.single("photo"), async (req, res) => {
  const { title, description } = req.body;

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${uuserIDv4()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: "public-read",
  };

  s3.upload(uploadParams, async (err, data) => {
    if (err) {
      return res.status(500).send("Error uploading photo");
    }

    const newPhoto = new Photo({
      title,
      description,
      imgUrl: data.Location,
    });

    await newPhoto.save();
    res.status(200).send("Photo uploaded successfully");
  });
});
