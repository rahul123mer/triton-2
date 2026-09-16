import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('C:/SSGC/POS-ScreenDescription/frontend/node_modules/playwright')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

await page.goto('http://localhost:5173/restaurant/tables/tbl-04', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Guests seated/ }).first().click()
await page.waitForTimeout(800)
const video = page.locator('video.rdi-video')
const count = await video.count()
let ready = false
if (count) {
  await video.first().evaluate((el) => el.play().catch(() => {}))
  await page.waitForTimeout(1200)
  ready = await video.first().evaluate((el) => el.readyState >= 2 && el.videoWidth > 0 && !el.error)
  const meta = await video.first().evaluate((el) => ({ readyState: el.readyState, w: el.videoWidth, h: el.videoHeight, dur: el.duration, src: el.currentSrc }))
  console.log('video meta', meta, 'ready', ready)
}
await page.screenshot({ path: 'C:/SSGC/Triton-2/scripts/evidence.png' })

await page.goto('http://localhost:5173/restaurant/kitchen/kit-daniel', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /Entered Prep/ }).first().click()
await page.waitForTimeout(800)
const kitchenVideo = page.locator('video.rdi-video')
const kitchenReady = await kitchenVideo.first().evaluate((el) => el.readyState >= 2 && el.videoWidth > 0).catch(() => false)
console.log('kitchen video ready', kitchenReady, 'errors', errors)
await browser.close()
if (!ready) process.exit(1)
