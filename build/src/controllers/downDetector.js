"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
class DownDetectorController {
    constructor() {
        this.url = 'https://downdetector.com/status/facebook/';
        this.makeUrl = (service) => {
            const url = `https://downdetector.com/status/${service}`;
            return url;
        };
        this.sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds));
        };
        this.accessDownDetector = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { serviceName } = req.params;
            const browser = yield puppeteer_1.default.launch({
                headless: true,
                slowMo: 200
            });
            const page = yield browser.newPage();
            yield page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
            yield page.setDefaultNavigationTimeout(0);
            yield page.goto(this.makeUrl(serviceName))
                .catch(error => {
                console.log(error);
            });
            const result = yield page.evaluate(() => {
                const titleElement = document.getElementsByClassName('entry-title')[0];
                const titleTextContent = String(titleElement.textContent);
                // get title
                const firstLetter = titleTextContent.indexOf('User');
                const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length);
                const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'));
                const currentServiceProperties = window['DD']['currentServiceProperties'];
                const status = currentServiceProperties['status'];
                const series = currentServiceProperties['series'];
                const baseline = series['baseline']['data'];
                const reports = series['reports']['data'];
                return {
                    title,
                    status,
                    baseline,
                    reports
                };
            });
            yield browser.close();
            return res.json({ result });
        });
        this.accessDownDetectorRoutine = (serviceName, browser) => __awaiter(this, void 0, void 0, function* () {
            const url = this.makeUrl(serviceName);
            const pageInstance = yield browser.newPage();
            yield pageInstance.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
            yield pageInstance.setDefaultNavigationTimeout(0);
            yield pageInstance.goto(url);
            const data = yield pageInstance.evaluate(() => {
                const titleElement = document.getElementsByClassName('entry-title')[0];
                const titleTextContent = String(titleElement.textContent);
                // get title
                const firstLetter = titleTextContent.indexOf('User');
                const textSlicedToFirstLetter = titleTextContent.slice(firstLetter, titleTextContent.length);
                const title = textSlicedToFirstLetter.slice(0, textSlicedToFirstLetter.indexOf('\n'));
                const currentServiceProperties = window['DD']['currentServiceProperties'];
                const status = currentServiceProperties['status'];
                const series = currentServiceProperties['series'];
                const baseline = series['baseline']['data'];
                const reports = series['reports']['data'];
                return {
                    name: title.split(' ')[title.split('').length - 1],
                    title,
                    status,
                    baseline,
                    reports
                };
            });
            const result = Object.assign({ url }, data);
            console.log(`${serviceName} status: ${data.status}`);
            pageInstance.close();
            return result;
        });
    }
}
exports.default = DownDetectorController;
