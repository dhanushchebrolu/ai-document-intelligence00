const express = require("express")
const multer = require("multer")
const cors = require("cors")
const fs = require("fs")
const pdfParse = require("pdf-parse")
const Tesseract = require("tesseract.js")
const axios = require("axios")

const app = express()
app.use(cors())

const upload = multer({ dest: "uploads/" })

async function extractText(path, type) {
  if (type === "application/pdf") {
    const data = await pdfParse(fs.readFileSync(path))
    return data.text
  }
  const result = await Tesseract.recognize(path, "eng")
  return result.data.text
}

async function runLLM(text) {
  const prompt = `Extract Driving License info as JSON from this text:\n${text}`

  const r = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt,
    stream: false
  })

  return r.data.response
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const text = await extractText(req.file.path, req.file.mimetype)
    const out = await runLLM(text)
    res.json({ extracted: out, raw_text: text })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "failed" })
  }
})

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000")
})
