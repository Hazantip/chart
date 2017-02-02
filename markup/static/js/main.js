'use strict';

/*
 This file can be used as entry point for webpack!
 */

import $ from 'jquery';
import Chartist from 'chartist';
import Hammer from 'hammerjs';
//import { debounce, log } from './utils';
//import './hch';

class Chart {
	constructor(container, data, options) {
		this.container = container;
		this.$c = $(container);
		this.hc = new Hammer(this.$c[0]);
		this.chart = null;
		this.width = 0;
		this.height = 0;
		this.offset = {};
		this.drawEnable = false;
		this.eventsAttached = false;
		this.scrollBlocked = false;

		this.defaultOptions = {
			high: 10,
			low: 0,
			showArea: false,
			axisY: {
				onlyInteger: true,
				offset: 40,
				labelInterpolationFnc: function (value) {
					return `${value * 1000}$`;
				}
			},
			axisX: {},
		};
		this.options = Chartist.extend({}, this.defaultOptions, options);
		this.data = data;
	}

	setDrawEnable(state) {
		this.drawEnable = state;
	}

	mouseDownListener() {
		this.$c.on('mousedown touchstart', (e) => {
			this.setDrawEnable(true);
			this.scrollBlocked = true;
			//console.info(e);
		});
	}

	mouseUpListener() {
		this.$c.on('mouseup touchend', (e) => {
			this.setDrawEnable(false);
			this.scrollBlocked = false;
			//console.info(e);
		});
	}

	resizeListener() {
		//window.addEventListener('resize', this.init.bind(this), false);
		//window.addEventListener('resize', debounce(this.init.bind(this), 300), false);
	}

	mouseMoveListener() {
		$(window).on('touchmove', (e) => {
			if (this.scrollBlocked) {
				e.preventDefault();
			}
		});
		//const el = document.querySelector(this.container);
		$(document).on('mousemove touchmove', (e) => {

			console.info('move...');

			if (!this.drawEnable) {
				return false;
			}

			//e.originalEvent.preventDefault(); // cursor drag fix

			const pageX = e.pageX || e.touches[0].pageX || e.srcEvent.pageX;
			const pageY = e.pageY || e.touches[0].pageY || e.srcEvent.pageY;

			console.info(`[x, y]: ${pageX}, ${pageY}`);

			const partY = this.height / this.options.high; // 5 max Y val
			const partX = this.width / this.data.labels.length; // 5 max X val
			const xSelector = Math.round(
				((pageX - this.offset.left) / partX)
			).toFixed(0);

			//console.info(xSelector);

			if (xSelector > (this.data.labels.length / 2 - 1) && xSelector < this.data.labels.length) {

				this.data.series[1][xSelector] = Math.floor(
					parseInt(((this.height + this.offset.top) - pageY) / partY, 10)
				).toFixed(0);

				this.chart.update();
			}
		});
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

			if (!this.eventsAttached) {
				this.init(obj);
			}
		});
	}

	attachListeners() {
		console.info('attach');
		this.mouseDownListener();
		this.mouseUpListener();
		this.resizeListener();
		this.mouseMoveListener();
		this.eventsAttached = true;
	}

	init(obj) {
		console.info('init');
		this.offset = {
			top: this.$c[0].getBoundingClientRect().top + obj.chartRect.y2,
			left: this.$c[0].getBoundingClientRect().left + obj.chartRect.x1,
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

	render() {
		const { container, data, options } = this;

		this.chart = new Chartist.Line(container, data, options);
		this.createdListener();
		this.drawListener();
	}
}











$(document).ready(() => {

	const data = {
		labels: ['2008', null, null, '2011', null, null, '2014', null, null, '2017'],
		series: [
			[3, 1, 9, 6, 8, 4, 5, 6, 9, 2],
			[null, null, null, null, 8],
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
	// Array(10).fill().map((e,i)=> (Math.random() * 10).toFixed(0) )
	// Array.from({length: 10}, (v, k) => (Math.random() * 10).toFixed(0) );
		data.series[0] = Array(10).fill().map(() => (Math.random() * 10).toFixed(0) );
		data.series[1][4] = data.series[0][4];
		chart.chart.update(data);
	// chart.render();
	});

});
