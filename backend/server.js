const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });


// -------- TEXT EXTRACTION --------
async function extractText(path, type) {
  if (type === "application/pdf") {
    const data = await pdfParse(fs.readFileSync(path));
    return data.text;
  }

  const result = await Tesseract.recognize(path, "eng");
  return result.data.text;
}


// -------- GROQ LLM --------
async function runLLM(text) {
  const prompt = `Analyze this document and summarize key info:\n${text}`;

  const r = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return r.data.choices[0].message.content;
}


// -------- ROUTE --------
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const text = await extractText(req.file.path, req.file.mimetype);
    const out = await runLLM(text);

    fs.unlinkSync(req.file.path);

    res.json({
      filename: req.file.originalname,
      extracted_preview: text.substring(0, 300),
      analysis: out
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "processing failed" });
  }
});


app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
