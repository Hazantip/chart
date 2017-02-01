/**
 * Created by hazantip on 2/1/17.
 */

// Debounce
export function debounce(f, ms) {
	let state = null;

	const COOLDOWN = 1;

	return function () {
		if (state) {
			return;
		}

		f.apply(this, arguments);

		state = COOLDOWN;

		setTimeout(function () {
			state = null;
		}, ms);
	};
}


export function log(...args) {
	args.forEach((msg) => {
		console.info(`\n${msg}: `, msg);
	});
}


