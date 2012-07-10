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

define('Sage/Platform/Mobile/ScrollContainer', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_UiComponent'
], function(
    declare,
    lang,
    domClass,
    _WidgetBase,
    _UiComponent
) {
    /* todo: going to need some way to temporarily turn off the iScroll container when view is not visible, i.e. resize events. */
    return declare('Sage.Platform.Mobile.ScrollContainer', [_WidgetBase, _UiComponent], {
        baseClass: 'scroll-container',
        startup: function() {
            this.inherited(arguments);

            var child = this.domNode.children[0];
            if (child) domClass.add(child, 'scroll-content');

            var hasTouch = true; 'ontouchstart' in window;
            if (hasTouch)
            {
                this._scroll = new iScroll(this.domNode, {
                    useTransition: true,
                    checkDOMChanges: false,
                    hScrollbar: false,
                    vScrollbar: false
                });
            }
        },
        onContentChange: function() {
            console.log('content changed: %s', this.getComponentOwner().id);
            if (this._scroll)
                this._scroll.refresh();
        },
        destroy: function(preserveDom) {
            if (this._scroll)
            {
                this._scroll.destroy(!preserveDom);

                delete this._scroll;
            }

            this.inherited(arguments);
        }
    });

});