/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('Sage/Platform/Mobile/Charts/AreaChart', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/dom-class',
    'Sage/Platform/Mobile/Charts/_Chart',
    'Sage/Platform/Mobile/ChartManager',
    'dojox/charting/plot2d/Areas',
    'dojox/charting/plot2d/Markers',
    'dojox/charting/axis2d/Default'
], function(
    declare,
    domAttr,
    domClass,
    _Chart,
    ChartManager,
    Areas
) {
    var chart = declare('Sage.Platform.Mobile.Charts.AreaChart', [_Chart], {
        xAxis: {
            fixLower: 'major',
            fixUpper: 'major',
            minorTicks: false
        },
        yAxis: {
            vertical: true,
            fixLower: 'major',
            fixUpper: 'major',
            minorTicks: false
        },
        plotType: Areas,
        plotOptions: {
            markers: false,
            tension: 'X'
        },

        getSeries: function() {
            return {name: 'APL', data: this.getData()};
        },
        getData: function() {
            var data = [];
            for (var i=0; i < 10; i++)
            {
                data.push(Math.floor(Math.random() * (1000 - 100 + 1)) + 100);
            }
            return data;
        }
    });

    ChartManager.register('area', chart);

    return chart;
});