import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import multer from 'multer'

dotenv.config()

const app = express();
app.use(cors({
    origin:"*"
}))

const upload = multer({dest:'uploads/'});

const imageDatabase = [];

const port = process.env.PORT || 5000

async function calculateHash(imagePath) {
    const image = sharp(imagePath);
    const { data, info } = await image
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
  
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += data[i] < 128 ? '0' : '1';
    }
    return hash;
  }
  
  app.post('/add-image', upload.single('image'), async (req, res) => {
    try {
      const hash = await calculateHash(req.file.path);
      imageDatabase.push({ path: req.file.path, hash });
      res.json({ message: 'Image added to database' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process image' });
    }
  });
  
  app.post('/search', upload.single('image'), async (req, res) => {
    try {
      const searchHash = await calculateHash(req.file.path);
      
      const results = imageDatabase
        .map(img => ({
          path: img.path,
          similarity: calculateSimilarity(searchHash, img.hash)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
  
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process image' });
    }
  });
  
  function calculateSimilarity(hash1, hash2) {
    let similarity = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) similarity++;
    }
    return similarity / hash1.length;
  }
  
app.use('/uploads', express.static('uploads'));

app.listen(port,()=>{
    console.log(`server running on port:${port}`)
})