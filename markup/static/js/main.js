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

class Chart {
	constructor(container, data, options) {

		this.container = container;
		this.el = document.querySelector(container);
		this.elOverlay = this.el.querySelector('.overlay');
		this.chart = null;

		this.data = data;
		this.defaultOptions = {
			high: 0,
			low: 0,
			showArea: false,
			fullWidth: true,
			axisY: {
				onlyInteger: true,
				//offset: 40,
				labelInterpolationFnc: function (value) {
					return `${value}$`;
				},
				//position: 'start',
				//labelOffset: {
				//	x: 0,
				//	y: 0
				//},
			},
			axisX: {
				//type: Chartist.AutoScaleAxis
				//offset: 40,
				//position: 'end',
				labelOffset: {
					//x: -15,
					y: 5
				},
			}
		};
		this.options = merge(this.defaultOptions, options);

		this.width = 0;
		this.height = 0;
		this.xAxisStepLength = 0;
		this.offset = {};
		this.finalPath = {};
		this.clipPath = null;

		this.drawEnable = false;
		this.scrollBlocked = false;
		this.eventType = 'ontouchstart' in document.documentElement ? 'touch' : 'mouse';
		this.eventsAttached = false;
	}

	disableScroll() {
		document.addEventListener(events[this.eventType].move, (e) => {
			if (this.scrollBlocked) {
				e.preventDefault();
				//console.info('blocked');
			} else {
				//console.info('unblocked');
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
		this.setDrawEnable(false);
		this.log(e.type);
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

		// - TODO: prevent draw from some middle point(should be 1,2,3....  not 3,2,1 or 3,4,5)
		// + FIXME: point.y is bit wrong when page scrolled;

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
		this.elOverlay.addEventListener(events[this.eventType].up, this.onUpListener.bind(this), false);
		this.elOverlay.addEventListener(events[this.eventType].move, this.onMoveListener.bind(this), false);
		window.addEventListener('resize', this.onResizeListener.bind(this), false);
		//window.addEventListener('resize', debounce(this.update.bind(this), 300), false);
		this.eventsAttached = true;
	}

	update(data) {
		console.info('update', data);

		this.height = data.chartRect.height();
		this.width = data.chartRect.width();
		this.xAxisStepLength = data.axisX.stepLength;
		this.offset = {
			top: this.el.getBoundingClientRect().top + data.chartRect.y2,
			left: this.el.getBoundingClientRect().left + data.chartRect.x1,
		};
	}

	drawFinalPath() {
		//this.finalPath.node.style.transition = '1000ms ease';
		//this.finalPath.node.style.strokeDashoffset = 0;
		console.info(this.clipPath);
	}

	drawListener() {
		console.info('draw');
		this.chart.on('draw', (data) => {
			console.log(data);
			if (data.type === 'line' && data.index === SERIES_ORDER.final) {
				//console.log(data, data.element._node.getTotalLength());
				this.finalPath = {
					data: data,
					node: data.element._node,
					length: data.element._node.getTotalLength(),
				};
				data.element.attr({
					'style': 'clip-path: url(#anim)'
				});
				//data.element._node.style.strokeDashoffset = data.element._node.getTotalLength();
				//data.element._node.style.strokeDasharray = data.element._node.getTotalLength();
			}
			if (data.type === 'point') {
				//
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

			if (this.clipPath) {
				//var marker = new Chartist.Svg('g');
				//
				//marker.elem('circle', {
				//	cx: data.x, cy: data.y, r:7
				//}, 'marker-A');

				this.clipPath = data.svg.elem('defs', false, false, true)
					.elem('clipPath', { id: 'anim' })
					.elem('rect', {
						//x: 0, y: 0, width: data.svg.width(), height: data.svg.height()
						x: 0, y: 0, width: 0, height: data.svg.height()
					})
					.animate({
						width: {
							begin: 0,
							dur: 20,
							from: 0,
							to: data.svg.width(),
							easing: Chartist.Svg.Easing.easeOutQuint
						}
					});
				this.finalPath.data.element.attr('clip-path', 'url(#anim)');
				console.log(this.finalPath.node.parentNode, this.finalPath.data); //   clip-path: url(#clip-health-care);
			}
		});
	}

	render() {
		const { container, data, options } = this;

		this.chart = new Chartist.Line(container, data, options);
		this.createdListener();
		this.drawListener();
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
					result = this.fillArray(0, breakPoint, array); // array.slice(0, breakPoint);
					break;
				case SERIES_ORDER.final:
					result = this.fillArray(breakPoint - 1, array.length, array); // array.slice(breakPoint, array.length);
					break;
				case SERIES_ORDER.user:
					result = this.fillArray(breakPoint - 1, breakPoint, array); // array.slice(breakPoint - 1, breakPoint);
					break;
				default:
					break;
			}
			return result;
		});
	}

	init() {
		this.data.series = this.generateArrays(this.data.series[0], this.data.breakPoint);
		this.defaultOptions.high = Math.max(...[...this.data.series[SERIES_ORDER.initial], ...this.data.series[SERIES_ORDER.final]]);

		this.render();
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

const labels = ['2008', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
const dataSize = labels.length;
const dataArr = new Array(dataSize).fill(null).map(() => (+(Math.random() * 1000).toFixed(4)));
const breakPoint = dataSize / 2;

document.addEventListener('DOMContentLoaded', () => {

	const data = {
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
	//const chart = new Chartist.Line('.ct-chart', data, options);

	console.info(chart);

	document.querySelector('.btn').addEventListener('click', () => {

		chart.drawFinalPath();
		//data.series[0] = new Array(10).fill(null).map(() => (Math.random() * 10).toFixed(0) );
		//data.series[1][4] = data.series[0][4];
		//chart.chart.update(data);
	});

});
