// status text
const statusLines = status.textContent ? [status.textContent] : [];
function renderStatus() {
	const filteredLines = statusLines
		.map((line) => (typeof line === "string" ? line : ""))
		.filter((line) => line != null);
	statusLines.length = 0;
	statusLines.push(...filteredLines);
	status.textContent = statusLines.join("\n").trim();
}
function clearStatus() {
	statusLines.length = 0;
	renderStatus();
}
function setStatus(...lines) {
	statusLines.length = 0;
	statusLines.push(...lines);
	renderStatus();
}
function setStatusLine(line, text) {
	statusLines[line] = text;
	renderStatus();
}
function appendToStatusLine(line, text) {
	statusLines[line] += text;
	renderStatus();
}
function appendStatusLine(line, text) {
	statusLines.push(line);
	renderStatus();
}
function removeStatusLine(line, softRemove = true) {
	if (softRemove) statusLines[line] = null;
	else statusLines.splice(line, 1);
	renderStatus();
}
function getStatusLine(line) {
	return statusLines[line];
}

// misc
function delay(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

// words & word frequencies
const wordListURL = `${location.origin}/words_freq.txt`;
async function getWordList() {
	const r = await fetch(wordListURL);
	const wordsString = await r.text();
	const words = wordsString
		.split("\n")
		.sort((a, b) => a.localeCompare(b))
		.map((word) => word.toUpperCase().trim());
	return words;
}
async function getWordFrequencyList() {
	const r = await fetch(wordListURL);
	const listString = await r.text();
	const list = listString
		.split("\n")
		.map((word) => word.trim().toUpperCase());
	return list;
}
async function getWordFrequency(word) {
	const wordFrequencies = await getWordFrequencyList();
	if (wordFrequencies.includes(word))
		// return frequency as a number in the harmonic series for easy comparison
		// this also obeys Zipf's law, which word frequencies also obey
		return 1 / (wordFrequencies.indexOf(word) + 1);
	else return Infinity;
}
async function getRandomWordByFrequency() {
	const wordList = await getWordFrequencyList();
	const random = Math.random() + 1;
	const getProbabilityOfIndex = (index) => {
		return 1 / Math.round(random * wordList.length + 1);
	};
	let targetIndex = 0;
	while (getProbabilityOfIndex(targetIndex) > random) targetIndex++;
	const word = wordList[targetIndex];
	return word;
}
