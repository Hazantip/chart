'use strict';

/*
 This file can be used as entry point for webpack!
 */

import Highcharts from 'highcharts';
import DynamicChart from './hch';
//import { debounce, log } from './utils';


document.onreadystatechange = function () {
	if (document.readyState === 'complete') {
		//console.log('2. document onreadystatechange');
	}
};

document.addEventListener('DOMContentLoaded', () => {
	//console.log('1. document is ready. I can sleep now');

	const arr = [0, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4];
	function fillArray(fromPoint, toPoint, array) {
		const len = array.length;
		return new Array(len).fill(null).map((item, key) => {
			if (key >= fromPoint && key < toPoint) {
				return array[key];
			} else {
				return null;
			}
		});
	}

	function generateArrays(array, breakPoint) {
		const count = 3;
		return new Array(count).fill(null).map((item, key) => {
			let result;
			switch (key) {
				case 0:
					result = fillArray(0, breakPoint, array); // array.slice(0, breakPoint);
					break;
				case 1:
					result = fillArray(breakPoint - 1, array.length, array); // array.slice(breakPoint, array.length);
					break;
				case 2:
					result = fillArray(breakPoint - 1, breakPoint, array); // array.slice(breakPoint - 1, breakPoint);
					break;
				default:
					break;
			}
			return result;
		});
	}

	const params = {
		credits: {
			enabled: false
		},
		chart: {
			animation: false,
		},
		title: {
			text: 'Under Mr. Obama, the number of immigrants convicted of crimes who were deported...'
		},
		xAxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		},
		yAxis: {
			min: 0,
			max: 300
		},
		plotOptions: {
			series: {
				point: {
					events: {

						drag: function (e) {
							// Returning false stops the drag and drops. Example:
							console.info('drag: ', e);
							if (e.newY > 300) {
								//this.y = 300;
								//return false;
							}

							$('#drag').html(
								'Dragging <b>' + this.series.name + '</b>, <b>' + this.category + '</b> to <b>' + Highcharts.numberFormat(e.y, 2) + '</b>');
						},
						drop: function () {
							$('#drop').html(
								'In <b>' + this.series.name + '</b>, <b>' + this.category + '</b> was set to <b>' + Highcharts.numberFormat(this.y, 2) + '</b>');
						}
					}
				},
				stickyTracking: false
			},
			column: {
				stacking: 'normal'
			},
			line: {
				cursor: 'ns-resize'
			}
		},
		tooltip: {
			yDecimals: 2
		},
		legend: {
			layout: 'horizontal',
			align: 'center',
			verticalAlign: 'top',
			x: 50,
			y: 300,
			floating: true,
			//borderWidth: 1,
			//backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
		},
		series: [
			{
				name: 'Bush years',
				data: generateArrays(arr, arr.length / 2)[0],
				draggableY: false,
				draggableX: false,
			},
			{
				name: 'Obama years',
				data: generateArrays(arr, arr.length / 2)[1],
				draggableY: false,
				draggableX: false,
				//visible: false,

			},
			{
				//name: 'My opinion',
				data: generateArrays(arr, arr.length / 2)[2],
				dashStyle: 'ShortDash',
				color: '#e67300',
				lineWidth: 3,
			}
		]
	};

	const chartEl = document.getElementById('highchart');
	const chart = new DynamicChart(chartEl, params, { breakPoint: arr.length / 2 });

}, false);

