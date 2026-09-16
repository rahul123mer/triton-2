import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { chromium } = require('C:/SSGC/POS-ScreenDescription/frontend/node_modules/playwright')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

async function body() { return page.locator('body').innerText() }
async function go(url) { await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle', timeout: 25000 }) }

await go('/restaurant')
let text = await body()
const checks = []
const expect = (name, cond) => checks.push([name, cond])
expect('ember', text.includes('The Ember Room'))
expect('dinner', text.includes('Dinner'))
expect('alex insight or name', text.includes('Alex Morgan') || text.includes('longest occupancy'))
await page.screenshot({ path: 'C:/SSGC/Triton-2/scripts/overview.png' })

await go('/restaurant/tables/tbl-04')
text = await body()
expect('t04', text.includes('T04'))
expect('seated', text.includes('Guests seated'))
expect('19:02', text.includes('19:02:14'))
expect('19:48', text.includes('19:48:31'))
expect('20:04', text.includes('20:04:12'))
expect('alex visit', text.includes('Alex Morgan'))

await page.getByRole('button', { name: /Guests seated/ }).first().click()
await page.waitForTimeout(400)
text = await body()
expect('event drawer', text.includes('EVENT EVIDENCE') || text.includes('Event ID') || text.includes('evt-occ-t04'))

await go('/restaurant/service/wtr-alex?table=tbl-04')
text = await body()
expect('alex page', text.includes('Alex Morgan'))
expect('visit duration', text.includes('Entered') && text.includes('Exited'))

await go('/restaurant/analysis?recipe=rcp-waiter-service&table=tbl-04')
text = await body()
expect('recipe result', text.includes('T04 received') && text.includes('waiter visit'))

await go('/restaurant/kitchen/kit-daniel')
text = await body()
expect('daniel', text.includes('Daniel Carter'))
expect('plating', text.includes('Plating'))
expect('prep enter', text.includes('Entered Prep') || text.includes('Prep'))

await go('/restaurant/reports')
text = await body()
expect('report finding', text.includes('longest occupancy') || text.includes('highest number'))

console.log(checks.map(([n, ok]) => `${ok ? 'PASS' : 'FAIL'} ${n}`).join('\n'))
console.log('errors', errors)
await browser.close()
if (checks.some(([, ok]) => !ok) || errors.length) process.exit(1)
