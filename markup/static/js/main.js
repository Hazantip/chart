'use strict';

/*
 This file can be used as entry point for webpack!
 */

import $ from 'jquery'; // TODO: implement without it
import { merge } from 'lodash';
import Chartist from 'chartist';
//import { debounce, log } from './utils';

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

class Chart {
	constructor(container, data, options) {

		this.container = container;
		this.el = document.querySelector(container);
		this.elOverlay = this.el.querySelector('.overlay');
		this.chart = null;

		this.data = data;
		this.defaultOptions = {
			high: Math.max(...this.data.series[0]),
			low: 0,
			showArea: false,
			axisY: {
				onlyInteger: true,
				offset: 40,
				labelInterpolationFnc: function (value) {
					return `${value}$`;
				}
			},
			axisX: {},
		};
		this.options = merge(this.defaultOptions, options);

		this.width = 0;
		this.height = 0;
		this.offset = {};

		this.drawEnable = false;
		this.scrollBlocked = false;
		this.eventType = 'ontouchstart' in document.documentElement ? 'touch' : 'mouse';
		this.eventsAttached = false;
	}

	disableScroll() {
		document.addEventListener(events[this.eventType].move, (e) => {
			if (this.scrollBlocked) {
				e.preventDefault();
				console.info('blocked');
			} else {
				console.info('unblocked');
			}
		}, false);
	}

	setDrawEnable(state) {
		this.drawEnable = state;
		this.scrollBlocked = state;
		this.disableScroll();
	}

	onResizeListener() {
		//window.addEventListener('resize', this.init.bind(this), false);
		//window.addEventListener('resize', debounce(this.init.bind(this), 300), false);
	}

	onDownListener() {
		this.elOverlay.addEventListener(events[this.eventType].down, (e) => {
			this.setDrawEnable(true);
			this.log('down');
		}, true);
	}

	onUpListener() {
		this.elOverlay.addEventListener(events[this.eventType].up, (e) => {
			this.setDrawEnable(false);
			this.log('up');
		}, true);
	}

	onMoveListener() {
		this.elOverlay.addEventListener(events[this.eventType].move, (e) => {

			this.log('move');

			if (!this.drawEnable) {
				return false;
			}

			//e.originalEvent.preventDefault(); // cursor drag fix

			const pageX = e.pageX || e.touches[0].pageX;
			const pageY = e.pageY || e.touches[0].pageY;
			const partX = this.width / this.data.labels.length;
			const partY = this.height / this.options.high;

			const points = {
				y: ( (this.height + this.offset.top) - pageY ) / partY
			};

			const xSelector = Math.round( ((pageX - this.offset.left) / partX) ).toFixed(0);

			//console.info(`[x, y]: ${pageX}, ${pageY}`);
			//console.info(xSelector);

			// TODO: prevent draw from some middle point(should be 1,2,3....  not 3,2,1 or 3,4,5)

			if (
				xSelector >= 0
				&& xSelector < this.data.labels.length
				&& xSelector > (this.data.labels.length / 2 - 1)
				&& points.y >= 0
				&& points.y <= this.options.high
			) {

				this.data.series[1][xSelector] = points.y;
				this.chart.update();
				//this.chart.detach();
			}
		}, true);
	}

	attachListeners() {
		console.info('attach');
		this.onDownListener();
		this.onUpListener();
		this.onResizeListener();
		this.onMoveListener();
		this.eventsAttached = true;
	}

	init(obj) {
		console.info('init', obj);
		this.offset = {
			top: this.el.getBoundingClientRect().top + obj.chartRect.y2,
			left: this.el.getBoundingClientRect().left + obj.chartRect.x1,
		};
		this.height = obj.chartRect.height();
		this.width = obj.chartRect.width();

		if (!this.eventsAttached) {
			this.attachListeners();
		}

		//console.info(
		//	'init',
		//	'offset: ', this.offset,
		//	'h: ', this.height,
		//	'w: ', this.width
		//);
	}

	drawListener() {
		console.info('draw');
		this.chart.on('draw', (data) => {
			if (data.type === 'point' || data.type === 'line') {
				// console.info(data);

				// if (data.seriesIndex === 0) {
				// 	data.element.animate({
				// 	  opacity: {
				// 		 begin: 0,
				// 		 dur: 0,
				// 		 from: 0,
				// 		 to: 0,
				// 	  }
				// });
				// }
			}
			if (data.type === 'grid') {
				//this.$grid = $(data.element._node).parent();
				//const gridWidth = this.$grid[0].getBoundingClientRect().width;
				//
				//if (gridWidth !== 0 && gridWidth > this.width) {
				//	this.init();
				//	if (!this.eventsAttached) {
				//		this.eventsAttached = true;
				//		this.attachListeners();
				//	}
				//}
			}
		});
	}

	createdListener() {
		this.chart.on('created', (obj) => {

			console.log('created');
			this.log('created');

			if (!this.eventsAttached) {
				this.init(obj);
			}
		});
	}

	render() {
		const { container, data, options } = this;

		this.chart = new Chartist.Line(container, data, options);
		this.createdListener();
		this.drawListener();
	}

	log(event, custom = { name: '', text: ''}) {
		$('#log').text(
			`event: ${event}
			\nthis.eventType: ${this.eventType}
			\nthis.scrollBlocked: ${this.scrollBlocked}
			\nthis.drawEnable: ${this.drawEnable}
			\n${custom.name} ${custom.text}`
		);
	}
}








var num = (Math.random() * 1000).toFixed(4);


$(document).ready(() => {

	const data = {
		labels: ['2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'],
		series: [
			new Array(10).fill(null).map((arr, i) => {
				console.info(i);
				if (i === 4) {
					return 8;
				} else {
					return +(Math.random() * 1000).toFixed(0);
				}
			}),
			[null, null, null, null, 8]
		],
	};

	const options = {
		showArea: false,
		lineSmooth: Chartist.Interpolation.none({
			fillHoles: false
		}),
	};

	const chart = new Chart('.ct-chart', data, options);
	chart.render();

	console.info(chart);

	$('.btn').on('click', () => {

		data.series[0] = new Array(10).fill(null).map(() => (Math.random() * 10).toFixed(0) );
		data.series[1][4] = data.series[0][4];
		chart.chart.update(data);

	});

});
