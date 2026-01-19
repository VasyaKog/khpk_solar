import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8787

app.get('/api/solax/realtime',
    async (req, res) => {
    try {
        const tokenId = req.query.tokenId || process.env.SOLAX_TOKEN_ID || ''
        const sn = req.query.sn || process.env.SOLAX_SN || ''
        if (!tokenId || !sn) {
            return res.status(400).json({ success:false, exception:'Missing tokenId/sn' })
        }
        const url = 'https://global.solaxcloud.com/api/v2/dataAccess/realtimeInfo/get';
        const rawResponse = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'tokenId': tokenId,
                },
                body: JSON.stringify({
                    wifiSn: sn,
                }),
            }
        );
        const data = await rawResponse.json();

        res.setHeader('Cache-Control', 'no-store')
        res.json(data);
    // res.json({ success:true, result: {}});
    } catch (e) {
        res.status(500).json({ success:false, exception: String(e) })
    }
})

// Serve built files if present
const distDir = path.join(__dirname, 'dist')
app.use(express.static(distDir))

const publicDir = path.join(__dirname, 'public')
app.use(express.static(publicDir))

app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
    console.log('Server listening on http://0.0.0.0:' + PORT)
})
