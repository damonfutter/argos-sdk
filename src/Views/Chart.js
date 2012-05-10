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

define('Sage/Platform/Mobile/Views/Chart', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'Sage/Platform/Mobile/ChartManager',
    'Sage/Platform/Mobile/View',
    'Sage/Platform/Mobile/Charts/ColumnChart',
    'Sage/Platform/Mobile/Charts/PieChart',
    'Sage/Platform/Mobile/Charts/LineChart',
    'Sage/Platform/Mobile/Charts/BarChart',
    'Sage/Platform/Mobile/Charts/AreaChart'
], function(
    declare,
    lang,
    array,
    domConstruct,
    ChartManager,
    View
) {

    return declare('Sage.Platform.Mobile.Views.Chart', [View], {
        // Localization
        titleText: 'Chart',

        //Templates
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div class="panel-content" data-dojo-attach-point="contentNode" style="width:100%; height:100%"></div>',
            '</div>'
        ]),

        //View Properties
        id: 'chart_detail',
        expose: false,
        charts: {},

        processChart: function(o) {
            if (!o) return;
            if (!lang.isArray[o]) o = [o];

            for (var i = 0; i < o.length; i++)
            {
                var current = o[i],
                    ctor = ChartManager.get(current['type']),
                    chart = this.charts[current['name']] = new ctor(current);
                chart.renderTo(this.contentNode);
            }

        },
        refresh: function() {
            this.inherited(arguments);
            this.clear();
            this.processChart(this.options.chart);
        },
        clear: function() {
            domConstruct.empty(this.contentNode);
        }
    });
});