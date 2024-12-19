// pkg 僅支援 CommonJS 打包方式
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const yargs = require( 'yargs');
const process = require( 'process');
const express = require( 'express');
const puppeteer = require( 'puppeteer');
const { fileURLToPath } = require( 'url');
const { hideBin } = require('yargs/helpers');
const { dirname, join, basename } = require('path');

// pkg 不支援 ES module 打包方式
// import fs from 'fs';
// import cors from 'cors';
// import axios from 'axios';
// import yargs from 'yargs';
// import process from 'process';
// import express from 'express';
// import puppeteer from 'puppeteer';
// import { fileURLToPath } from 'url';
// import { hideBin } from 'yargs/helpers';
// import { dirname, join, basename } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

function getAppDir () {
  if(process.pkg && process.pkg.entrypoint) {
      return path.dirname(process.pkg.entrypoint); }
  return process.cwd();
}

const __dirname = getAppDir ()

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Setup for logging via SSE
let logEmitter = null;  // This will store the client connection to send logs to

app.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  logEmitter = res;

  req.on('close', () => {
    logEmitter = null;  // Clean up when client disconnects
  });
});

// 使用 yargs 處理命令行參數
const argv = yargs(hideBin(process.argv))
  .option('fccId', {
    description: 'FCC ID to scrape',
    type: 'string',
    demandOption: false,  // 要求傳遞此參數
  })
  .option('dateLimit', {
    description: 'Date limit for scraping',
    type: 'string',
    demandOption: false,  // 要求傳遞此參數
  })
  .help()
  .alias('help', 'h')
  .argv;

// 如果沒有傳遞參數，則提示用戶輸入
if (argv.fccId && argv.dateLimit) {

  // 從命令行參數中獲取值
  const { fccId, dateLimit } = argv;
  console.log(`Starting scrape for FCC ID: ${fccId || 'N/A'} with date limit: ${dateLimit || 'N/A'}`);

  async function runScrape() {
    console.log(`Scraping with FCC ID: ${fccId} and date limit: ${dateLimit}`);

    // 這裡可以呼叫實際的爬蟲邏輯
    try {
      await scrapeFCC(fccId, dateLimit); // 假設 scrapeFCC 是你實現的爬蟲函數
      console.log('Scraping completed');
    } catch (error) {
      console.error(`Error occurred during scraping: ${error.message}`);
    }
    return;
  }

  runScrape();
}

async function scrapeFCC(fccId, date_limit) {

  // Read the fccID.json and fileKey.json file
  const fccIDPath   = join(__dirname, 'public', 'fccID.json');
  const fileKeyPath = join(__dirname, 'public', 'fileKey.json');
  let fccIDData, fileKeyData, fccidList, fileKeyList;
  try {
    const fcc_rawData = await fs.promises.readFile(fccIDPath, 'utf8');
    const key_rawData = await fs.promises.readFile(fileKeyPath, 'utf8');
    fccIDData   = JSON.parse(fcc_rawData);
    fileKeyData = JSON.parse(key_rawData);

  } catch (error) {
    console.error('Error reading fccID.json or fileKey.json :', error);
    sendLog('Error reading fccID.json or fileKey.json');
    return;
  }

  const browser = await puppeteer.launch({ executablePath: 'chrome-win/chrome.exe' });
  // const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  // Disable unnecessary resources (like images, stylesheets, etc.)
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
      request.abort();
    } else {
      request.continue();
    }
  });

  if (fccId === "All") {
    fccidList = fccIDData.map( item => item.fccid)
  } else{
    fccidList = [fccId]
  }
  console.log("Download FCC List", fccidList);
  for (const fccId of fccidList) {
    try{
      const timeout = 120000;
      const url = `https://fccid.io/${fccId}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout });
      await page.waitForSelector('body', { timeout });

      const linksWithDates = await page.$$eval('td', tds =>
        tds
          .map(td => {
            const anchor = td.querySelector('a');
            const dateText = td.innerText.match(/\d{4}-\d{2}-\d{2}/);
            return anchor
              ? {
                  href: anchor.href,
                  date: dateText ? dateText[0] : null,
                }
              : null;
          })
          .filter(item => item !== null)
      );
      const downloadLinks = [];
      const fileDates     = [];  // 用來儲存 PDF 原始日期

      for (const item of linksWithDates) {
        let pdfLink;
        const link = item.href;
        const itemDate  = new Date(item.date);
        const limitDate = new Date(date_limit);

        if (limitDate < itemDate) {
          await page.goto(link, { waitUntil: 'networkidle0', timeout });
          await page.waitForSelector('body');

          const sublinks = await page.$$eval('a', anchors => anchors.map(anchor => anchor.href));

          fileKeyList = fileKeyData.map( item => item.name)
          if (fileKeyList && fileKeyList.length > 0) {
            console.log("Download specified file");
            for(const fileKey of fileKeyList) {
              pdfLink = sublinks.find(sublink => sublink.includes(fileKey));

              // [ 一定要找到pdf才會執行下載，但要多連入一層速度慢了不少 ]
              // if (pdfLink) {
              //   await page.goto(pdfLink, { waitUntil: 'networkidle0' });
              //   await page.waitForSelector('body');

              //   const pdfLinks = await page.$$eval('a', anchors =>
              //     anchors
              //       .map(anchor => anchor.href)
              //       .filter(href => href.endsWith('.pdf'))
              //   );

              //   if (pdfLinks.length > 0) {
              //     const pdfLink = pdfLinks[0];
              //     sendLog(`Found ${fileKey} PDF link: ${pdfLink}`);
              //     downloadLinks.push(pdfLink);
              //   }
              // }

              // [ 根據規則，找到link直接在結尾加上.pdf作為下載位置 ]
              if (pdfLink) {
                sendLog(`Add ${fileKey} PDF link: ${pdfLink}`);
                downloadLinks.push(pdfLink+'.pdf');
                fileDates.push(itemDate);
              }
            }
          } else {
            console.log("Download all PDFs from the page");

            // 使用 page.$$eval 並將 link 作為參數傳遞
            const allPdfLinks = await page.$$eval('a', (anchors, link) => {
              return anchors
                .map(anchor => anchor.href)
                .filter(href => href && href.startsWith(link + '/'));
            }, link);

            // 將抓取到的所有 PDF 連結加入到 downloadLinks 陣列中
            for (const pdfLink of allPdfLinks) {
              downloadLinks.push(pdfLink+'.pdf');
              fileDates.push(itemDate);
            };
          }
        }
      }
      if (downloadLinks.length > 0 && fileDates.length === downloadLinks.length) {
        console.log("#######################", downloadLinks, fileDates, fccId);
        const fccId_dict = fccIDData.find(item => item.fccid === fccId);
        await downloadMultiplePDFs(downloadLinks, fccId_dict.name, fileDates);
      }
    } catch (error) {
      console.error('Error scraping:', error);
      sendLog(`Error scraping ${fccId}`);
      continue;
    }
  }
  await browser.close();
  sendLog('Scraping completed');
}

// Emit log message to connected frontend
function sendLog(message) {
  if (logEmitter) {
    logEmitter.write(`data: ${JSON.stringify({ message })}\n\n`);
  }
}

async function downloadPDF(url, outputPath, originalDate) {
  const dir = dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.utimes(dir, originalDate, originalDate);
  }

  const response = await axios.get(url, {
    responseType: 'stream',
    maxRedirects: 5,
  });
  const writer = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  sendLog(`PDF downloaded to: ${outputPath}`);
}

async function downloadMultiplePDFs(urls, fccId_getName, fileDates) {
  const uniqueUrls = Array.from(new Set(urls));
  const downloadPromises = uniqueUrls.map((pdfUrl, index) => {
    const fileName   = basename(pdfUrl);
    const fccId_prod = pdfUrl.split('/')[3];
    const originalDate = fileDates[index];
    const yearMonth  = originalDate.toISOString().slice(0, 7);
    const outputPath = join(__dirname, 'download', yearMonth, fccId_getName, fccId_prod, fileName);

    return downloadPDF(pdfUrl, outputPath, originalDate);
  });

  try {
    await Promise.all(downloadPromises);
    sendLog('All PDFs downloaded successfully');
  } catch (error) {
    sendLog(`Error downloading PDFs: ${error.message}`);
  }
}


app.post('/scrapeFCC', async (req, res) => {
  const { fccId, dateLimit } = req.body;

  if (!fccId || !dateLimit) {
    return res.status(400).send({ success: false, message: 'FCC ID or date is missing' });
  }

  try {
    await scrapeFCC(fccId, dateLimit);
    res.send({ success: true, message: 'Scraping completed' });
  } catch (error) {
    res.status(500).send({ success: false, message: `Error occurred during scraping: ${error.message}` });
  }
});

app.post('/save-data', async (req, res) => {
  try {
    const data = JSON.stringify(req.body, null, 2);
    const filePath = join(__dirname, "public/fccID.json");
    console.log('Saving to file:', filePath);

    await fs.promises.writeFile(filePath, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'Failed to save data' });
  }
});

app.post('/save-key', async (req, res) => {
  try {
    const data = JSON.stringify(req.body, null, 2);
    const filePath = join(__dirname, "public/fileKey.json");
    console.log('Saving to file:', filePath);

    await fs.promises.writeFile(filePath, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: 'Failed to save key' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
