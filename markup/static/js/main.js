'use strict';

/*
 This file can be used as entry point for webpack!
 */

import { merge } from 'lodash';
import Chartist from 'chartist';

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

// Data series arrays order
const SERIES_ORDER = {
	'initial': 2,
	'user': 1,
	'final': 0,
};

const POINT_TEXT_Y_CORRELATION = 4;
const BREAKPOINT_TEXT_Y_CORRELATION = 15; // middle point
const FINALPOINT_X_CORRELATION = 10;
const FINALPOINT_TEXT_X_CORRELATION = 20;

class Chart {
	constructor(container, data, options) {

		this.container = container;
		this.el = document.querySelector(container);
		this.elOverlay = this.el.querySelector('.ct-chart-overlay');
		this.chart = null;

		this.data = data;
		this.defaultOptions = {
			high: 0,
			low: 0,
			showArea: false,
			fullWidth: true,
			axisY: {
				onlyInteger: true,
				offset: 0,
				//labelInterpolationFnc: Chartist.noop,
				labelInterpolationFnc: function (value) {
					return `${value}$`;
				},
				showLabel: false,
			},
			axisX: {
				labelOffset: {
					y: 5
				},
			},
			ui: {
				colors: {
					start: '#ff6347',
					end: '#00bfff',
					user: '#f4c63d',
					area: '#f3f3f3'
				}
			},
		};
		this.options = merge(this.defaultOptions, options);

		this.width = 0;
		this.height = 0;
		this.xAxisStepLength = 0;
		this.offset = {};
		this.clipPath = null;
		this.startPointValue = null;
		this.middlePointValue = null;
		this.finalPoint = {};

		this.drawEnable = false;
		this.scrollBlocked = false;
		this.eventType = 'ontouchstart' in document.documentElement ? 'touch' : 'mouse';
		this.eventsAttached = false;
	}

	disableScroll() {
		document.addEventListener(events[this.eventType].move, (e) => {
			if (this.scrollBlocked) {
				e.preventDefault();
			}
		}, false);
	}

	setDrawEnable(state) {
		this.drawEnable = state;
		this.scrollBlocked = state;
		this.disableScroll();
	}

	onResizeListener(e) {
		// do stuff;
	}

	onDownListener(e) {
		this.setDrawEnable(true);
		this.log(e.type);
	}

	onUpListener(e) {
		this.log(e.type);
		if (this.drawEnable) {
			this.setDrawEnable(false);
		}
	}

	onMoveListener(e) {
		this.log(e.type);

		if (!this.drawEnable) {
			return false;
		}

		//e.originalEvent.preventDefault(); // cursor drag fix

		const userSeriesIndex = SERIES_ORDER.user;

		const pageX = e.clientX || e.touches[0].clientX;
		const pageY = e.clientY || e.touches[0].clientY;
		const partX = this.xAxisStepLength; // this.width / this.data.labels.length;
		const partY = this.height / this.options.high;

		const points = {
			y: ( (this.height + this.offset.top) - pageY ) / partY
		};

		const xSelector = Math.round( ((pageX - this.offset.left) / partX) ).toFixed(0);

		//console.info(`[x, y]: ${pageX}, ${pageY}`);
		//console.info(xSelector);

		if (
			xSelector >= 0
			&& xSelector < this.data.labels.length
			&& xSelector > this.data.breakPoint - 1
			&& points.y >= 0
			&& points.y <= this.options.high
		) {

			this.data.series[userSeriesIndex][xSelector] = points.y;
			this.chart.update();
			//this.chart.detach();
		}
	}

	attachListeners() {
		console.info('attach');

		this.elOverlay.addEventListener(events[this.eventType].down, this.onDownListener.bind(this), false);
		this.elOverlay.addEventListener(events[this.eventType].move, this.onMoveListener.bind(this), false);

		// to document, because want to be able to catch up, outside of the chart
		document.documentElement.addEventListener(events[this.eventType].up, this.onUpListener.bind(this), false);

		//window.addEventListener('resize', this.onResizeListener.bind(this), false);
		//window.addEventListener('resize', debounce(this.update.bind(this), 300), false);

		this.eventsAttached = true;
	}

	update(data) {
		//console.info('update', data);

		this.height = data.chartRect.height();
		this.width = data.chartRect.width();
		this.xAxisStepLength = data.axisX.stepLength;
		this.offset = {
			top: this.el.getBoundingClientRect().top + data.chartRect.y2,
			left: this.el.getBoundingClientRect().left + data.chartRect.x1,
		};
	}

	drawListener() {
		//console.info('draw');
		const clipPathID = 'FINAL_SERIES_CLIP';

		this.chart.on('draw', (data) => {

			// Remove user area
			if (data.type === 'area' && data.seriesIndex === SERIES_ORDER.user) {
				data.element.remove();
			}

			// Render clipPath for final area
			if (data.type === 'area' && data.seriesIndex === SERIES_ORDER.final) {
				this.clipPath = data.element.root()
					.elem('defs', false, false, true)
					.elem('clipPath', { id: clipPathID })
					.elem('rect', {
						x: 0, y: 0,
						width: 0,
						height: data.element.root().height()
					});
			}

			// Clip final area
			if (data.type === 'line' && data.index === SERIES_ORDER.final) {
				data.element.parent().attr({ 'style': `clip-path: url(#${clipPathID})` });
			}

			// Draw legend
			if (data.type === 'area') {
				//debugger;
				const chartFirstPartWidth = data.axisX.axisLength / (this.data.series[0].length / this.data.breakPoint);
				const chartSecondPartWidth = data.axisX.axisLength - chartFirstPartWidth;

				if (data.seriesIndex === SERIES_ORDER.initial) {
					data.element.root()
						.elem('text', {
							x: chartFirstPartWidth / 2,
							y: data.axisY.axisLength,
							'text-anchor': 'middle'
						})
						.text(this.data.legend.start)
						.addClass('ct-legend');
				}
				if (data.seriesIndex === SERIES_ORDER.final) {
					data.element.root()
						.elem('text', {
							x: chartFirstPartWidth + (chartSecondPartWidth / 2),
							y: data.axisY.axisLength,
							'text-anchor': 'middle'
						})
						.text(this.data.legend.end)
						.addClass('ct-legend');
				}
				if (!this.finalPoint.text) {
					data.element.root()
						.elem('text', {
							x: chartFirstPartWidth + (chartSecondPartWidth / 2),
							y: data.axisY.axisLength / 3,
							'text-anchor': 'middle'
						})
						.text(this.data.legend.user)
						.addClass('ct-legend ct-legend-instructions');
				}
			}

			// Draw start points values
			if (data.type === 'point' && data.seriesIndex === SERIES_ORDER.initial) {
				if (data.index === 0) {
					this.startPointValue = data.group
						.elem('text', {
							x: data.x - 10,
							y: data.y + POINT_TEXT_Y_CORRELATION,
							'text-anchor': 'end',
						})
						.addClass('ct-point-value');
					this.startPointValue.text(data.value.y.toFixed(0));
				}
				if (data.index === this.data.breakPoint - 1) {
					this.middlePointValue = data.group
						.elem('text', {
							x: data.x - 10,
							y: data.y + BREAKPOINT_TEXT_Y_CORRELATION,
							'text-anchor': 'end',
						})
						.addClass('ct-point-value');
					this.middlePointValue.text(data.value.y.toFixed(0));
				}
			}

			// Draw user point value
			if (data.type === 'point' && data.seriesIndex === SERIES_ORDER.user) {

				if (data.index === this.data.breakPoint) {
					this.finalPoint.text = data.group
						.elem('text', {
							x: data.axisX.axisLength + FINALPOINT_TEXT_X_CORRELATION,
							y: data.y + POINT_TEXT_Y_CORRELATION,
							'text-anchor': 'start',
						})
						.addClass('ct-point-value');
				}

				if (this.finalPoint.text) {
					this.finalPoint.text.attr({ 'y': data.y + POINT_TEXT_Y_CORRELATION });
					this.finalPoint.text._node.innerHTML = data.value.y.toFixed(0);
				}

				// set dot position (NOTE: just css:last-of-type is visible)
				data.element.attr({
					x1: data.axisX.axisLength + FINALPOINT_X_CORRELATION,
					x2: data.axisX.axisLength + FINALPOINT_X_CORRELATION
				});
			}

			// Draw final point value
			if (data.type === 'point' && data.seriesIndex === SERIES_ORDER.final) {
				if (data.index === data.series.length - 1) {
					this.startPointValue = data.group
						.elem('text', {
							x: data.axisX.axisLength + FINALPOINT_TEXT_X_CORRELATION,
							y: data.y + POINT_TEXT_Y_CORRELATION
						})
						.addClass('ct-point-value');
					this.startPointValue.text(data.value.y.toFixed(0));
				}
			}
		});
	}

	createdListener() {
		this.chart.on('created', (data) => {

			this.log('created');

			if (!this.eventsAttached) {
				this.attachListeners();
			}
			this.update(data);
		});
	}

	render() {
		const { container, data, options } = this;

		this.chart = new Chartist.Line(container, data, options);
		this.createdListener();
		this.drawListener();
		this.renderTitle();
	}

	fillArray(fromPoint, toPoint, array) {
		const len = array.length;
		return new Array(len).fill(null).map((item, key) => {
			if (key >= fromPoint && key < toPoint) {
				return array[key];
			} else {
				return null;
			}
		});
	}

	generateArrays(array, breakPoint) {
		const count = 3;
		return new Array(count).fill(null).map((item, key) => {
			let result;
			switch (key) {
				case SERIES_ORDER.initial:
					result = this.fillArray(0, breakPoint, array);
					break;
				case SERIES_ORDER.final:
					result = this.fillArray(breakPoint - 1, array.length, array);
					break;
				case SERIES_ORDER.user:
					result = this.fillArray(breakPoint - 1, breakPoint, array);
					break;
				default:
					break;
			}
			return result;
		});
	}

	init() {
		this.data.series = this.generateArrays(this.data.series[0], this.data.breakPoint);
		this.options.high = Math.max(...[...this.data.series[SERIES_ORDER.initial], ...this.data.series[SERIES_ORDER.final]]);

		this.render();
	}

	showResults() {
		this.clipPath.animate({
			width: {
				begin: 0,
				dur: 2500,
				// 50 - random value, to fix start animation position
				from: this.clipPath.root().width() / (this.data.series[0].length / this.data.breakPoint) - 50,
				// 50 - random value, for prevent clip last point value which is outer of chart
				to: this.clipPath.root().width() + 50,
				easing: Chartist.Svg.Easing.easeOutQuad
			}
		});
	}

	renderTitle() {
		const { title = '' } = this.data;
		if (title) {
			const node = document.createElement('div');
			node.classList.add('ct-chart-title');
			node.innerHTML = title.replace(new RegExp(/{/, 'g'), '<b>').replace(new RegExp(/}/, 'g'), '</b>');

			this.el.parentNode.insertBefore(node, this.el);
		}
	}

	log(event, custom = { name: '', text: ''}) {
		document.getElementById('log').innerHTML = `
			\nevent: ${event}
			\nthis.eventType: ${this.eventType}
			\nthis.scrollBlocked: ${this.scrollBlocked}
			\nthis.drawEnable: ${this.drawEnable}
			\n${custom.name} ${custom.text}
		`;
	}
}

const labels = ['2008', '09', '10', '11', '12', '13', '14', '15', '16', '2017'];
const dataSize = labels.length;
const dataArr = new Array(dataSize).fill(null).map(() => (+(Math.random() * 1000).toFixed(4)));
const breakPoint = dataSize / 2;

document.addEventListener('DOMContentLoaded', () => {

	const data = {
		title: 'Under Mr. Obama, {the number} of {violent crimes} per 100,000 people..',
		legend: {
			start: 'BUSH YEARS',
			end: 'OBAMA YEARS',
			user: 'Draw the line'
		},
		labels: labels,
		series: [ dataArr ],
		breakPoint
	};

	const options = {
		showArea: true,
		lineSmooth: Chartist.Interpolation.none({
			fillHoles: false
		})
	};

	const chart = new Chart('.ct-chart', data, options);
	chart.init();
	console.info(chart);

	document.querySelector('.ct-chart-btn').addEventListener('click', () => {
		chart.showResults();
	});

	// + TODO: add values on points
	// + TODO: add chart title
	// + TODO: add legend
	// TODO: hide user legend when start drawing
	// TODO: 	prevent draw from some middle point(should be 1,2,3....  not 3,2,1 or 3,4,5)
	// 			OR IF CLICK ON MIDDLE SHOULD DRAW PREVIOUS POINTS
	// + TODO: disable draw on mouseUP when mouseOUT and the same for touch
	// TODO: detach all events when clicked - 'show results' and disable draw again
	// TODO: draw .btn from Class
	// TODO: draw animated grid fot hidden part

});

/*
var options = {
	axisX: {
		offset: 30,
		position: "end",
		labelOffset: {
			x: 0,
			y: 0
		},
		showLabel: true,
		showGrid: true,
		labelInterpolationFnc: Chartist.noop,
		type: undefined
	},
	axisY: {
		offset: 40,
		position: "start",
		labelOffset: {
			x: 0,
			y: 0
		},
		showLabel: true,
		showGrid: true,
		labelInterpolationFnc: Chartist.noop,
		type: undefined,
		scaleMinSpace: 20,
		onlyInteger: false
	},
	width: undefined,
	height: undefined,
	showLine: true,
	showPoint: true,
	showArea: false,
	areaBase: 0,
	lineSmooth: true,
	low: undefined,
	high: undefined,
	chartPadding: {
		top: 15,
		right: 15,
		bottom: 5,
		left: 10
	},
	fullWidth: true,
	reverseData: false,
	classNames: {
		chart: "ct-chart-line",
		label: "ct-label",
		labelGroup: "ct-labels",
		series: "ct-series",
		line: "ct-line",
		point: "ct-point",
		area: "ct-area",
		grid: "ct-grid",
		gridGroup: "ct-grids",
		vertical: "ct-vertical",
		horizontal: "ct-horizontal",
		start: "ct-start",
		end: "ct-end"
	}
};
*/
