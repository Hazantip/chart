import { merge } from 'lodash';
import Highcharts from 'highcharts';

const events = {
	'touch': {
		'down': 'touchstart',
		'up': 'touchend',
		'move': 'touchmove',
	},
	'mouse': {
		'down': 'mousedown',
		'up': 'mouseup',
		'move': 'mousemove',
	},
};

class DynamicChart {
	constructor(container, params, dataSettings) {
		this.container = container; // id or element
		this.chart = new Highcharts.Chart(container, params);
		this.drawEnable = false;
		this.eventsAttached = false;
		this.scrollBlocked = false;
		this.eventType = 'ontouchstart' in document.documentElement ? 'touch' : 'mouse';

		this.defaultParams = {
			chart: {
				animation: false,
				events: {
					load: this.onLoad(),
				}
			}
		};
		this.params = merge(this.defaultParams, params);
		this.dataSettings = dataSettings; // pointTo
	}

	setDrawEnable(state) {
		this.drawEnable = state;
	}

	disableScroll() {
		if (this.eventType === 'touch') {
			document.addEventListener(events.touch.move, (e) => {
				e.preventDefault();
			});
		}
	}

	onDown() {
		this.container.addEventListener(events[this.eventType].down, () => {
			this.setDrawEnable(true);
			this.scrollBlocked = true;
		});
	}

	onUp() {
		this.container.addEventListener(events[this.eventType].up, () => {
			this.setDrawEnable(false);
			this.scrollBlocked = false;
		});
	}

	onMove() {

		this.disableScroll();

		const el = this.container;
		const chart = this.chart;
		const userSeriesIndex = this.params.series.length - 1;

		el.addEventListener(events[this.eventType].move, (e) => {
			//console.log(chart);
			//chart.series[0].data[5].y = e.pageY;
			//chart.series[0].data[5].update();

			if (!this.drawEnable) {
				return false;
			}

			const pageX = e.pageX || e.touches[0].pageX;
			const pageY = e.pageY || e.touches[0].pageY;
			const plotH = chart.plotHeight;
			const plotW = chart.plotWidth;
			const points = chart.series[0].data;
			const elOffset = {
				x: el.getBoundingClientRect().left,
				y: el.getBoundingClientRect().top,
			};
			const offset = {
				x: elOffset.x + chart.plotLeft,
				y: elOffset.y + chart.plotTop,
			};

			//  console.info(`[x, y]: ${pageX}, ${pageY}`);

			//const partY = plotH / this.options.high; // 5 max Y val
			const partX = plotW / points.length; // 5 max X val
			const xSelector = Math.round( ((pageX - offset.x) / partX) ).toFixed(0);

			const point = {
				y: (plotH + offset.y) - pageY,
				x: pageX - offset.x > 0 ? pageX - offset.x : 0,
			};

			if (
				xSelector >= 0
				&& xSelector < points.length
				&& xSelector >= this.dataSettings.breakPoint
				&& point.y >= 0
				&& point.y <= this.params.yAxis.max
			) {

				console.info(xSelector, point);

				//chart.series[0].data[xSelector].x = point.x;
				chart.series[userSeriesIndex].data[xSelector].y = point.y;
				chart.series[userSeriesIndex].data[xSelector].update();

				//this.data.series[1][xSelector] = Math.floor(
				//	parseInt(((plotH + offset.y) - pageY) / partY, 10)
				//).toFixed(0);
			}
		});
	}

	generateData() {
		const data = this.params.series[0];
		console.log(data);
	}

	onLoad() {
		setTimeout(() => {
			this.generateData();
			this.onDown();
			this.onUp();
			this.onMove();
		}, 50);
	}
}

//console.log(generateArrays(arr, arr.length / 2));

export default DynamicChart;
