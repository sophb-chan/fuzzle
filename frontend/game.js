/**
 * Defines the expected arguments of `spellCallback`.
 * @typedef {Object} SpellInnerArgs
 * @property {Array<number>} [indexes] - The indexes of the board tiles selected.
 * @property {string} [text] - The text the user spelled, in uppercase. This can be derived from the board indexes, but this is here anyway for ease of use.
 */
/**
 * Define the inner function type itself.
 * @callback spellCallback
 * @param {SpellInnerArgs} innerParams - The destructured arguments for the function.
 * @returns {void}
 */

/**
 * Defines the expected arguments of `selectCallback`.
 * @typedef {Object} SelectInnerArgs
 * @property {Array<number>} [selected] - The indexes of the board tiles selected.
 */
/**
 * Define the inner function type itself.
 * @callback selectCallback
 * @param {SelectInnerArgs} innerParams - The destructured arguments for the function.
 * @returns {void}
 */

/**
 * Defines the expected arguments of `tickCallback`.
 * @typedef {Object} TickInnerArgs
 * @property {number} [remainingTime] - The amount of time remaining, in seconds. This runs at the start of the game, and every second after that. The board continues to be interactive after this reaches zero, and it is your duty to unbind all event listeners and clear the tick interval when it reaches zero.
 */
/**
 * Define the inner function type itself.
 * @callback tickCallback
 * @param {TickInnerArgs} innerParams - The destructured arguments for the function.
 * @returns {void}
 */

/**
 * Define the top-level options object for the main function.
 * @typedef {Object} MainConfig
 * @property {spellCallback} [spellCallback] - A function that runs every time the user completes a word in the interactive board.
 * @property {selectCallback} [selectCallback] - A function that runs every time the user selects board tiles, including no tiles at all.
 * @property {tickCallback} [tickCallback] - A function that runs every second and on the start of the game to indicate a "tick".
 * @property {number} size - The board size to be used. Can either be 4, 5 or 6 (could change in the future).
 * @property {Object} rules - The rules of the current game.
 * @returns {Object}
 */
/**
 * Generates and renders an interactive Boggle board.
 *
 * @param {MainConfig} [options={}] - The main destructured options.
 */

/**
 * @typedef {Object} Output
 * @property {number} tickInterval - The interval ID for the tick interval.
 * @property {function(unbind: boolean):void} bindEventListeners - A function that either binds or unbinds all event listeners.
 * @property {HTMLDivElement} board - The board div itself.
 */

/**
 * Fetches user details.
 *
 * @returns {Output} A plain object containing the tick interval ID, a function to bind or unbind event listeners, and the board div.
 */
async function generateInteractiveBoard({
	spellCallback = ({} = {}) => {},
	selectCallback = ({} = {}) => {},
	tickCallback = ({} = {}) => {},
	size = 4,
	rules = {
		timeLimit: 30,
	},
} = {}) {
	const board = generateRandomBoard(size);
	const boardDiv = document.getElementById("board");
	renderBoard(board, rules);
	let mouseDown = false;
	const selected = [];
	function renderSelected() {
		for (const tile of boardDiv.querySelectorAll(".tile")) {
			const index = parseInt(tile.dataset.index);
			if (selected.includes(index)) tile.classList.add("active");
			else tile.classList.remove("active");
		}
	}

	const callbacks = {
		mousedown(event) {
			mouseDown = true;
			const target = event.target;
			if (!target.classList.contains("tile")) return;
			const targetIndex = parseInt(target.dataset.index);
			selected.push(targetIndex);
			selectCallback({ selected });
			renderSelected();
		},
		mouseover(event) {
			if (!mouseDown) return;
			const target = event.target;
			if (!target.classList.contains("tile")) return;
			const targetIndex = parseInt(target.dataset.index);
			if (selected.includes(targetIndex)) {
				const slice = selected.slice(
					0,
					selected.indexOf(targetIndex) + 1,
				);
				selected.length = 0;
				selected.push(...slice);
			} else selected.push(targetIndex);
			selectCallback({ selected });
			renderSelected();
		},
		mouseup() {
			const finishedSelection = structuredClone(selected);
			mouseDown = false;
			selected.length = 0;
			selectCallback({ selected });
			spellCallback({
				indexes: finishedSelection,
				text: finishedSelection.map((i) => board[i]).join(""),
			});
			renderSelected();
		},
	};
	const bindEventListeners = (unbind) => {
		for (const [event, callback] of Object.entries(callbacks)) {
			if (unbind) boardDiv.removeEventListener(event, callback);
			else boardDiv.addEventListener(event, callback);
		}
	};
	bindEventListeners();

	let remainingTime = rules.timeLimit;
	tickCallback({
		remainingTime,
	});
	const tickInterval = setInterval(() => {
		remainingTime--;
		tickCallback({
			remainingTime,
		});
	}, 1e3);

	return {
		tickInterval,
		bindEventListeners,
		select: (indexes) => {
			selected.length = 0;
			selected.push(...indexes);
			renderSelected();
		},
		board,
	};
}
async function startGame(
	boardSize,
	rules,
	callbacks = {
		endCallback: () => {},
	},
) {
	rules.minLength ??= 3;
	rules.timeLimit ??= 30;
	const words = await getWordList();
	const highTickSound = new Audio("sounds/high tick.wav");
	const lowTickSound = new Audio("sounds/low tick.wav");
	lowTickSound.volume = 0.25;
	highTickSound.volume = 0.25;

	const tickCallback = ({ remainingTime } = {}) => {
		if (remainingTime <= 0) {
			board.bindEventListeners(true);
			clearInterval(board.tickInterval);
			const score = computeScore(wordsFound, rules);
			for (const trigger of listStopTriggers) trigger();
			clearStatus();
			setStatus(
				"Time's up!",
				`Final score: ${score} points (${wordsFound.length} words)`,
			);
			callbacks.endCallback({
				wordsFound,
				score,
			});
			return;
		}
		if ((rules.timeLimit - remainingTime) % 4) lowTickSound.play();
		else highTickSound.play();
		setStatusLine(0, `${remainingTime} seconds remaining`);
	};
	const wordsFound = [];
	let score = 0;
	const listStopTriggers = [];
	const spellCallback = async ({ text, indexes } = {}) => {
		if (!rules.wildCard && text.indexOf("*") !== -1) return;

		if (text.length >= rules.minLength) {
			// get matched words
			const matchedWords = [];
			if (text.includes("*")) {
				const matcher = new RegExp(
					`^${text.replaceAll("*", ".")}$`,
					"i",
				);
				matchedWords.push(
					...words.filter((word) => {
						return matcher.test(word) && !wordsFound.includes(word);
					}),
				);
			} else matchedWords.push(text);

			// get valid words
			const wordsFoundInMatch = [];
			for (const [index, word] of matchedWords.entries()) {
				if (!words.includes(word)) {
					new Audio("sounds/invalid_word.wav").play();
					setStatusLine(1, `"${word}" is not a valid word`);
					continue;
				}
				if (wordsFound.includes(text)) {
					new Audio("sounds/invalid_word.wav").play();
					setStatusLine(1, `"${word}" was already found`);
					continue;
				}
				wordsFound.push(word);
				wordsFoundInMatch.push(word);
				score = computeScore(wordsFound, score);
			}

			// list words
			listStopTriggers.push(
				await listWords(wordsFoundInMatch, rules, false),
			);
		} else {
			if (text.length === 0) return;

			new Audio("sounds/invalid_word.wav").play();
			setStatusLine(2, `"${text}" is too short`);
		}
	};
	const selectCallback = ({ selected }) => {
		// position helpers
		const indexToXY = (index) => {
			const x = index % boardSize;
			const y = Math.floor(index / boardSize);
			return { x, y };
		};
		const XYtoIndex = (x, y) => {
			return x + y * boardSize;
		};
		// neighbor helpers
		const neighborDirections = [
			[-1, -1],
			[-1, 0],
			[-1, 1],
			[0, -1],
			[0, 0],
			[0, 1],
			[1, -1],
			[1, 0],
			[1, 1],
		];
		const getNeighbors = (originIndex) => {
			return neighborDirections.map((direction) => {
				const xOffset = direction[1];
				const yOffset = direction[0];

				if (xOffset === 0 && yOffset === 0)
					return null; // don't return self
				else {
					const originXY = indexToXY(originIndex);
					originXY.x += xOffset;
					originXY.y += yOffset;
					if (
						originXY.x < 0 ||
						originXY.x >= boardSize ||
						originXY.y < 0 ||
						originXY.y >= boardSize
					)
						// out of bounds
						return null;
					return XYtoIndex(originXY.x, originXY.y);
				}
			});
		};

		const text = selected.map((i) => board.board[i]).join("");
		if (!rules.wildCard && text.indexOf("*") !== -1) {
			board.select(
				selected.slice(
					0,
					selected.findIndex((tileIndex) => board[tileIndex] === "*"),
				),
			);
		}
		const disconnectedTileIndex = selected.findIndex((tileIndex, selectedIndex) => {
			if (selected.length === 1) return false;
			if (selectedIndex === 0) return false;
			const neighbors = getNeighbors(tileIndex);
			return !neighbors.includes(selected[selectedIndex - 1]);
		});
		if (disconnectedTileIndex !== -1) {
			board.select(
				selected.slice(
					0,
					disconnectedTileIndex,
				),
			);
		}
	};
	const board = await generateInteractiveBoard({
		size: boardSize,
		tickCallback,
		selectCallback,
		spellCallback,
		rules,
	});
	return board.board;
}

function computeScore(words, rules) {
	return words.reduce(
		(totalScore, word) =>
			totalScore + Math.max(1 + (word.length - rules.minLength), 0),
		0,
	);

	/* simplified code
    let totalScore = 0;
    for (const word of words) {
        totalScore += Math.max(1 + (word.length - rules.minLength), 0);
    }
    return totalScore;
    */
}
const wordsToBeListed = {};
async function listWords(words, rules, soundOnly = false, volume = 1.0) {
	const label = volume.toString();
	wordsToBeListed[label] ??= [];
	const isAlreadyListing = wordsToBeListed[label].length > 0;
	wordsToBeListed[label].push(...words);
	let stop = false;
	if (!isAlreadyListing) {
		if (getStatusLine(2)) removeStatusLine(2);
		let initialWord = wordsToBeListed[label][0];
		let listedWords = 0;
		let visibleWords = 0;
		const list = async () => {
			while (wordsToBeListed[label].length > 0 && !stop) {
				const wordSound = createWordSound(
					Math.max(initialWord.length, 3) + listedWords,
					rules,
					words.length > 1,
				);
				wordSound.volume = volume;
				wordSound.play();

				const word = wordsToBeListed[label].shift();
				if (words.length > 1) {
					if (wordsToBeListed[label].length === 0) {
						if (!soundOnly) appendToStatusLine(1, ` & "${word}"!`);
						break;
					} else if (listedWords === 0) {
						if (!soundOnly) setStatusLine(1, `Found "${word}"`);
					} else {
						if (!soundOnly) appendToStatusLine(1, `, "${word}"`);
					}
					if (visibleWords > 10) {
						if (!soundOnly) setStatusLine(1, `[...], "${word}"`);
						visibleWords = 0;
					}
					listedWords++;
					visibleWords++;
					await delay(250);
				} else if (!soundOnly) setStatusLine(1, `Found "${word}"!`);
			}
		};
		list();
	}
	return () => void (stop = true);
}
