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

/**
 * A Detail View represents a single record and should display all the info the user may need about the entry.
 *
 * A Detail entry is identified by its key (default: `$key`) which is how it requests the entry.
 *
 * @alternateClassName Detail
 * @extends View
 * @requires format
 * @requires utility
 * @requires ErrorManager
 * @requires ScrollContainer
 * @requires TitleBar
 * @requires CustomizationSet
 * @requires scene
 */
define('argos/Detail', [
    'dojo',
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/_base/lang',
    'dojo/_base/Deferred',
    'dojo/string',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/dom-construct',
    './format',
    './utility',
    './ErrorManager',
    './View',
    './ScrollContainer',
    './TitleBar',
    'argos!customizations',
    'argos!scene'
], function(
    dojo,
    declare,
    connect,
    lang,
    Deferred,
    string,
    dom,
    domClass,
    domAttr,
    domConstruct,
    format,
    utility,
    ErrorManager,
    View,
    ScrollContainer,
    TitleBar,
    customizations,
    scene
) {
    /* todo: make release note that `raw` has been changed to `value` and `value` to `formatted` */

    var defaultPropertyProvider = function(item, property, info) {
            return utility.getValue(item, property, item);
        },
        applyValueTemplate = function(data, container) {
            return data['valueTemplate'].apply(data.value, container);
        };

    return declare('argos.Detail', [View], {
        /**
         * @property {Object}
         * Event map, see {@link _EventMapMixin#events _EventMapMixin.events}.
         */
        events: {
            'click': true
        },
        /**
         * @property {Object[]}
         * Definition of the view and it's child components, see {@link _Component#components _Component.components} for examples
         * of the various component definition properties.
         */
        components: [
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'content', tag: 'div', attrs: {'class': 'detail-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        /**
         * @property {String}
         * Root level CSS classes
         */
        baseClass: 'view detail',
        _setDetailContentAttr: {node: 'contentNode', type: 'innerHTML'},
        /**
         * @property {Simplate}
         * HTML shown when no data is available.
         */
        emptyTemplate: new Simplate([
        ]),
        /**
         * @property {Simplate}
         * HTML shown when data is being loaded.
         *
         * `$` => the view instance
         */
        loadingTemplate: new Simplate([
            '<div class="loading-indicator">',
            '<div>{%: $.loadingText %}</div>',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that defines a layout section including the collapsible header
         *
         * `$` => the layout section object
         * `$$` => the view instance
         */
        sectionTemplate: new Simplate([
            '{% if ($.title !== false) { %}',
            '<h2 data-action="toggleCollapse" class="{% if ($.collapsed) { %}is-collapsed{% } %}">',
                '<span>{%: ($.title) %}</span>',
                '<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% } %}',
            '{% if ($.list) { %}',
            '<ul class="{%= $.cls %}"></ul>',
            '{% } else { %}',
            '<div class="{%= $.cls %}"></div>',
            '{% } %}'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for the inside (data) of the property row in the detail layout.
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        propertyItemTemplate: new Simplate([
            '<label>{%: $.label %}</label>',
            '<span>{%= $.formatted %}</span>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for the inside (data) of the related row in the detail layout.
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        relatedItemTemplate: new Simplate([
            '{% if ($.key) { %}',
            '<label>{%: $.label %}</label>',
            '<span>',
            '<a data-action="navigateToRelatedView" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
            '{%= $.formatted %}',
            '</a>',
            '</span>',
            '{% } else { %}',
            '<a data-action="navigateToRelatedView" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
            '{% if ($.icon) { %}<img src="{%= $.icon %}" alt="icon" class="icon" />{% } %}',
            '<span>{%: $.label %}</span>',
            '</a>',
            '{% } %}'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for the inside (data) of the action row in the detail layout.
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        actionItemTemplate: new Simplate([
            '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="icon" class="icon" />',
            '{% } %}',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.formatted %}</span>',
            '</a>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for the container of the property row in the detail layout.
         * Uses the rows itemTemplate for actual data.
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        standardRowTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '{%! $.itemTemplate %}',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for the container of the related/action rows in the detail layout.
         * Uses the rows itemTemplate for actual data.
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        listRowTemplate: new Simplate([
            '<li class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '{%! $.itemTemplate %}',
            '</li>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is shown when not available
         *
         * `$` => the view instance
         */
        notAvailableTemplate: new Simplate([
            '<div class="not-available">{%: $.notAvailableText %}</div>'
        ]),
        /**
         * @property {Number/Boolean}
         * Identifies which pane this view should be placed into and tracked with.
         */
        tier: 1,
        /**
         * @property {Object}
         * The dojo store this view will use for data exchange.
         */
        store: null,
        /**
         * @property {Object}
         * The layout definition that constructs the detail view with sections and rows
         */
        layout: null,
        /**
         * @cfg {String/Object}
         * May be used for verifying the view is accessible
         */
        security: false,
        /**
         * @property {String}
         * The customization identifier for this class. When a customization is registered it is passed
         * a path/identifier which is then matched to this property.
         */
        customizationSet: 'detail',
        /**
         * @property {String}
         * @deprecated
         */
        editText: 'Edit',
        /**
         * @cfg {String}
         * Default title text shown in the top toolbar, note by default this is overwritten with the passed navigation
         * options title/descriptor.
         */
        titleText: 'Detail',
        /**
         * @property {String}
         * Helper string for a basic section header text
         */
        detailsText: 'Details',
        /**
         * @property {String}
         * ARIA label text for a collapsible section header
         */
        toggleCollapseText: 'toggle collapse',
        /**
         * @property {String}
         * Text shown while loading and used in loadingTemplate
         */
        loadingText: 'loading...',
        /**
         * @property {String}
         * Text shown when a server error occurs
         */
        requestErrorText: 'A server error occurred while requesting data.',
        /**
         * @property {String}
         * Text used in the notAvailableTemplate
         */
        notAvailableText: 'The requested entry is not available.',
        /**
         * @cfg {String}
         * The view id to be taken to when the Edit button is pressed in the toolbar
         */
        editView: false,
        /**
         * @property {Object[]}
         * Store for mapping layout options to an index on the HTML node
         */
        _navigationOptions: null,

        /**
         * Subscribes to the global `/app/refresh` event and clears the view.
         */
        onStartup: function() {
            this.inherited(arguments);

            this.subscribe('/app/refresh', this._onRefresh);
            this.clear();
        },
        onDestroy: function() {
            this.inherited(arguments);

            delete this.store();
        },
        _getStoreAttr: function() {
            return this.store || (this.store = this.createStore());
        },
        /**
         * Sets and returns the toolbar item layout definition, this method should be overriden in the view
         * so that you may define the views toolbar items.
         * @return {Object} this.tools
         * @template
         */
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'top': [{
                    name: 'edit',
                    label: this.editText,
                    action: 'navigateToEditView',
                    security: App.getViewSecurity(this.editView, 'update')
                }]
            });
        },
        /**
         * Handler for the global `/app/refresh` event. Sets `refr
         * eshRequired` to true if the key matches.
         * @param {Object} o The object published by the event.
         * @private
         */
        _onRefresh: function(o) {
            /* todo: change to be something non-sdata specific */
            var descriptor = o.data && o.data['$descriptor'];

            if (this.options && this.options.key === o.key)
            {
                this.refreshRequired = true;

                if (descriptor)
                {
                    this.options.title = descriptor;
                    this.set('title', descriptor);
                }
            }
        },
        /**
         * Applies the entries property to a format string
         * @param {Object} entry Data entry
         * @param {String} fmt Where expression to be formatted, `${0}` will be the extracted property.
         * @param {String} property Property name to extract from the entry, may be a path: `Address.City`.
         * @return {String}
         */
        formatRelatedQuery: function(entry, fmt, property) {
            property = property || '$key';
            return string.substitute(fmt, [utility.getValue(entry, property)]);
        },
        /**
         * Toggles the collapsed state of the section.
         * @param {Event} evt Mouse event.
         * @param {HTMLElement} node Node that initiated the event.
         */
        toggleCollapse: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        /**
         * Navigates to the defined `this.editView` passing the current `this.entry` as default data.
         */
        navigateToEditView: function() {
            scene().showView(this.editView, {
                item: this.item
            });
        },
        /**
         * Navigates to a given view id passing the options retrieved using the slot index to `this._navigationOptions`.
         * @param {Event} evt Mouse event.
         * @param {HTMLElement} node Node that initiated the event.
         */
        navigateToRelatedView: function(evt, node) {
            var view = domAttr.get(node, 'data-view'),
                slot = domAttr.get(node, 'data-context'),
                descriptor = domAttr.get(node, 'data-descriptor'),
                options = this._navigationOptions[slot];
            if (options && descriptor)
                options['descriptor'] = descriptor;

            scene().showView(view, options);
        },
        /**
         * CreateStore is the core of the data handling for Detail Views. By default it is empty but it should return
         * a dojo store of your choosing. There are {@link _SDataDetailMixin Mixins} available for SData.
         * @return {*}
         */
        createStore: function() {
            return null;
        },
        /**
         * Required for binding to ScrollContainer which utilizes iScroll that requires to be refreshed when the
         * content (therefor scrollable area) changes.
         */
        onContentChange: function() {
        },
        /**
         * @template
         * Optional processing of the returned entry before it gets processed into layout.
         * @param {Object} item Entry from data store
         * @return {Object} By default does not do any processing
         */
        _processItem: function(item) {
            return item;
        },
        /**
         * Takes the entry from the data store, applies customization, applies any custom item process and then
         * passes it to process layout.
         * @param {Object} item Entry from data store
         */
        _processData: function(item) {
            var customizationSet = customizations(),
                layout = customizationSet.apply(customizationSet.toPath(this.customizationSet, null, this.id), this.createLayout());

            this.item = this._processItem(item);

            this._processLayout(layout, this.item);
        },
        _onGetComplete: function(item) {
            if (item)
            {
                this._processData(item);
            }
            else
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
            }

            domClass.remove(this.domNode, 'is-loading');

            /* this must take place when the content is visible */
            this.onContentChange();

            connect.publish('/app/toolbar/update', []);
        },
        _onGetError: function(getOptions, error) {
            if (error.aborted)
            {
                this.options = false; // force a refresh
            }
            else if (error.status == 404)
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
            }
            else
            {
                alert(string.substitute(this.requestErrorText, [error]));
            }

            var errorItem = {
                viewOptions: this.options,
                serverError: error
            };
            ErrorManager.addError(this.requestErrorText, errorItem);

            domClass.remove(this.domNode, 'is-loading');
        },
        _requestData: function() {
            var store = this.get('store'),
                getOptions = {
                };

            this._applyStateToGetOptions(getOptions);

            var getExpression = this._buildGetExpression() || null,
                getResults = store.get(getExpression, getOptions);

            Deferred.when(getResults,
                lang.hitch(this, this._onGetComplete),
                lang.hitch(this, this._onGetError, getOptions)
            );

            return getResults;
        },
        _buildGetExpression: function() {
            var options = this.options;

            return options && (options.id || options.key);
        },
        _applyStateToGetOptions: function(getOptions) {

        },
        /**
         * Sets and returns the Detail view layout by following a standard for section and rows:
         *
         * The `this.layout` itself is an array of section objects where a section object is defined as such:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        title: 'String', // Required. Text shown in the section header
         *        list: boolean, // Optional. Default false. Controls if the group container for child rows should be a div (false) or ul (true)
         *        children: [], // Array of child row objects
         *     }
         *
         * A child row object has:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        property: 'String', // Optional. The SData property of the current entity to bind to
         *        label: 'String', // Optional. Text shown in the label to the left of the property
         *        onCreate: function(), // Optional. You may pass a function to be called when the row is added to the DOM
         *        include: boolean, // Optional. If false the row will not be included in the layout
         *        exclude: boolean, // Optional. If true the row will not be included in the layout
         *        template: Simplate, // Optional. Override the HTML Simplate used for rendering the value (not the row) where `$` is the row object
         *        tpl: Simplate, // Optional. Same as template.
         *        renderer: function(), // Optional. Pass a function that receives the current value and returns a value to be rendered
         *        encode: boolean, // Optional. If true it will encode HTML entities
         *        cls: 'String', // Optional. Additional CSS class string to be added to the row div
         *        use: Simplate, // Optional. Override the HTML Simplate used for rendering the row (not value)
         *        provider: function(entry, propertyName), // Optional. Function that accepts the SData entry and the property name and returns the extracted value. By default simply extracts directly.
         *        value: Any // Optional. Provide a value directly instead of binding to SData
         *     }
         *
         * @return {Object[]} Detail layout definition
         */
        createLayout: function() {
            return this.layout || [];
        },
        _processLayoutRowValue: function(row, item) {
            var provider = row['provider'] || defaultPropertyProvider,
                property = typeof row['property'] == 'string'
                    ? row['property']
                    : row['name'],
                value = typeof row['value'] === 'undefined'
                    ? provider(item, property)
                    : this.expandExpression(row['value'], item);

            return value;
        },
        _processLayoutRow: function(layout, row, item, sectionNode) {
            var value = this._processLayoutRowValue(row, item);

            /* a generator creates markup */
            if (typeof row['generator'] === 'function')
            {
                var dynamicNode = row['generator'].call(this, row, value, item);
                if (dynamicNode) domConstruct.place(dynamicNode, sectionNode);
            }
            else
            {
                var provider = row['provider'] || defaultPropertyProvider,
                    rendered,
                    formatted;

                if (row['template'])
                {
                    rendered = (row['template']).apply(value, this);
                    formatted = row['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else if (row['renderer'] && typeof row['renderer'] === 'function')
                {
                    rendered = row['renderer'].call(this, value);
                    formatted = row['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else
                {
                    formatted = typeof value !== 'object'
                        ? row['encode'] !== false ? format.encode(value) : value
                        : '';
                }

                var data = lang.mixin({}, row, {
                    entry: item,
                    value: value,
                    formatted: formatted
                });

                if (row['descriptor'])
                    data['descriptor'] = typeof row['descriptor'] === 'function'
                        ? this.expandExpression(row['descriptor'], item, value)
                        : provider(item, row['descriptor']);

                if (row['action'])
                    data['action'] = this.expandExpression(row['action'], item, value);

                var hasAccess = App.hasAccessTo(row['security']);
                if (row['security'])
                    data['disabled'] = !hasAccess;

                if (row['disabled'] && hasAccess)
                    data['disabled'] = this.expandExpression(row['disabled'], item, value);

                if (row['view'])
                {
                    var context = lang.mixin({}, row['options']);
                    if (row['key'])
                        context['key'] = typeof row['key'] === 'function'
                            ? this.expandExpression(row['key'], item)
                            : provider(item, row['key']);
                    if (row['where'])
                        context['where'] = this.expandExpression(row['where'], item);
                    if (row['resourceKind'])
                        context['resourceKind'] = this.expandExpression(row['resourceKind'], item);
                    if (row['resourceProperty'])
                        context['resourceProperty'] = this.expandExpression(row['resourceProperty'], item);
                    if (row['resourcePredicate'])
                        context['resourcePredicate'] = this.expandExpression(row['resourcePredicate'], item);

                    data['view'] = row['view'];
                    data['context'] = (this._navigationOptions.push(context) - 1);
                }

                var useListTemplate = layout['list'],
                    rowTemplate = (row['rowTemplate'] || row['use'])
                        ? (row['rowTemplate'] || row['use'])
                        : useListTemplate
                            ? this.listRowTemplate
                            : this.standardRowTemplate;

                data['valueTemplate'] = row['valueTemplate'];
                data['itemTemplate'] = row['valueTemplate']
                    ? {apply: applyValueTemplate}
                    : row['itemTemplate']
                        ? row['itemTemplate']
                        : row['view']
                            ? this.relatedItemTemplate
                            : row['action']
                                ? this.actionItemTemplate
                                : this.propertyItemTemplate;

                data['itemTemplate'] = row['itemTemplate']
                    ? row['itemTemplate']
                    : row['view']
                        ? this.relatedItemTemplate
                        : row['action']
                            ? this.actionItemTemplate
                            : this.propertyItemTemplate;

                var node = domConstruct.place(rowTemplate.apply(data, this), sectionNode);

                if (row['onCreate'])
                    row['onCreate'].call(this, row, node, value, item);
            }
        },
        /**
         * Processes the given layout definition using the SData entry response by rendering and inserting the HTML nodes and
         * firing any onCreate events defined.
         * @param {Object[]} layout Layout definition
         * @param {Object} item Item from store
         */
        _processLayout: function(layout, item) {
            var rows = typeof layout['children'] === 'function'
                    ? layout['children'].call(this, layout, this._processLayoutRowValue(layout, item), item)
                    : layout['children']
                        ? layout['children']
                        : layout,
                sectionQueue = [],
                sectionStarted = false,
                i, current;

            for (i = 0; i < rows.length; i++) {
                current = rows[i];

                var section,
                    sectionNode,
                    include = this.expandExpression(current['include'], item),
                    exclude = this.expandExpression(current['exclude'], item);

                if (include !== undefined && !include) continue;
                if (exclude !== undefined && exclude) continue;

                if (current['children'])
                {
                    /* todo: do we need to defer anymore? */
                    if (sectionStarted)
                        sectionQueue.push(current);
                    else
                        this._processLayout(current, item);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    section = domConstruct.toDom(this.sectionTemplate.apply(layout, this));
                    sectionNode = section.lastChild || section;
                    domConstruct.place(section, this.contentNode);
                }

                this._processLayoutRow(layout, current, item, sectionNode);
            }

            for (i = 0; i < sectionQueue.length; i++)
            {
                current = sectionQueue[i];

                this._processLayout(current, item);
            }
        },
        /**
         * Determines if the view should be refresh by inspecting and comparing the passed navigation option key with current key.
         * @param {Object} options Passed navigation options.
         * @return {Boolean} True if the view should be refreshed, false if not.
         */
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options)
                {
                    if (this.options.key !== options.key) return true;
                }

                return false;
            }
            else
                return this.inherited(arguments);
        },
        /**
         * Extends the {@link View#activate parent implementation} to set the nav options title
         * attribute to the descriptor
         * @param tag
         * @param data
         */
        activate: function(options) {
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        /**
         * Returns the view key
         * @return {String} View key
         */
        getTag: function() {
            return this.options && this.options.key;
        },
        /**
         * Extends the {@link View#getContext parent implementation} to also set the resourceKind, label and id
         * @return {Object} View context object
         */
        getContext: function() {
            var options = this.options,
                id = options.id || options.key;

            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                label: this.options.title,
                id: id
            });
        },
        /**
         * Extends the {@link View#beforeTransitionTo parent implementation} to also clear the view if `refreshRequired` is true
         * @return {Object} View context object
         */
        beforeTransitionTo: function() {
            this.inherited(arguments);

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        /**
         * If a security breach is detected it sets the content to the notAvailableTemplate, otherwise it calls
         * {@link #_requestData _requestData} which starts the process sequence.
         */
        load: function() {
            this.inherited(arguments);

            /* todo: why is this here? */
            if (this.security && !App.hasAccessTo(this.expandExpression(this.security)))
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
                return;
            }

            this._requestData();
        },
        transitionTo: function() {
            this.inherited(arguments);
        },
        /**
         * Clears the view by replacing the content with the empty template and emptying the stored row contexts.
         */
        clear: function() {
            this._navigationOptions = [];

            domConstruct.place(this.loadingTemplate.apply(this), this.contentNode, 'only');

            domClass.add(this.domNode, 'is-loading');
        }
    });
});
