const dice = {
	4: [
		"AAEEGN",
		"ABBJOO",
		"ACHOPS",
		"AFFKPS",
		"AOOOTT",
		"CIMOTU",
		"DEILRX",
		"DELRVY",
		"DISTTY",
		"EEGHNW",
		"EEINSU",
		"EHRTVW",
		"EIOSST",
		"ELRTTY",
		"HIMN[QU]U",
		"HLNNRZ",
	],
	5: [
		"AAAFRS",
		"AAEEEE",
		"AAFIRS",
		"ADENNN",
		"AEEEEM",
		"AEEGMU",
		"AEGMNN",
		"AFIRSY",
		"BJKQXZ",
		"CCNSTW",
		"CEIILT",
		"CEILPT",
		"CEIPST",
		"DHHNOT",
		"DHHLOR",
		"DHLNOR",
		"DDLNOR",
		"EIIITT",
		"EMOTTT",
		"ENSSSU",
		"FIPRSY",
		"GORRVW",
		"HIPRRY",
		"NOOTUW",
		"OOOTTU",
	],
	6: [
		"AAAFRS",
		"AAEEEE",
		"AAEEOO",
		"AAFIRS",
		"ABDEIO",
		"ADENNN",
		"AEEEEM",
		"AEEGMU",
		"AEGMNN",
		"AEILMN",
		"AEINOU",
		"AFIRSY",
		"[AN][ER][HE][IN][QU][TH]",
		"BBJKXZ",
		"CCENST",
		"CDDLNN",
		"CEIITT",
		"CEIPST",
		"CFGNUY",
		"DDHNOT",
		"DHHLOR",
		"DHHNOW",
		"DHLNOR",
		"EHILRS",
		"EIILST",
		"EILPST",
		"EIO***",
		"EMTTTO",
		"ENSSSU",
		"GORRVW",
		"HIRSTV",
		"HOPRST",
		"IPRSYY",
		"JK[QU]WXZ",
		"NOOTUW",
		"OOOTTU",
	],
};
function parseDice(size) {
	const diceStrings = dice[size];
	if (diceStrings == null)
		throw new ReferenceError(`Unknown dice with size ${size}`);

	const diceArrays = [];
	const clusterRegex = /\[([A-Z]+)\]/g;
	for (const string of diceStrings) {
		const dieSides = [];
		const cleanString = string.replaceAll(clusterRegex, ($0, $1) => {
			dieSides.push($1);
			return "";
		});
		dieSides.push(...cleanString);
		diceArrays.push(dieSides);
	}
	return diceArrays;
}
function generateRandomBoard(size) {
	// this can generate board without words
	// make safe version later
	const boardTiles = [];
	const dice = parseDice(size);
	for (const die of dice) {
		let randomIndex = Math.floor(Math.random() * dice.length);
		while (boardTiles[randomIndex] != null) {
			randomIndex = Math.floor(Math.random() * dice.length);
		}
		const chosenSide = Math.floor(Math.random() * die.length);
		boardTiles[randomIndex] = die[chosenSide];
	}
	return boardTiles;
}
function renderBoard(board, rules) {
	const boardSize = Math.sqrt(board.length);
	const boardDiv = document.getElementById("board");
	boardDiv.innerHTML = "";

	let columnDiv;
	for (const [index, tile] of board.entries()) {
		if (index % boardSize === 0) {
			if (columnDiv) boardDiv.appendChild(columnDiv);
			columnDiv = document.createElement("div");
			columnDiv.classList.add("column");
		}
		const tileDiv = document.createElement("div");
		tileDiv.classList.add("tile");
		if (tile === "*") {
			if (rules.wildCard) tileDiv.textContent = "★";
			else tileDiv.textContent = "🛇";
		} else tileDiv.textContent = tile;
		tileDiv.dataset.index = index;
		tileDiv.title = index;
		columnDiv.appendChild(tileDiv);
	}
	boardDiv.appendChild(columnDiv);
}
function createWordSound(wordLength, rules, stack) {
	const score = Math.max(1 + (wordLength - rules.minLength), 1);
	const src = `${stack ? "stack" : "score"} ${score > 6 ? "max" : score}.wav`;
	return new Audio("sounds/" + src);
}
function playWordSound(wordLength, rules, stack) {
	createWordSound(wordLength, rules, stack).play();
}
