/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/


qx.Class.define("ms123.graphicaleditor.plugins.ShapeHighlighting", {
	extend: qx.core.Object,
	include: [ms123.util.MBindTo],
	/******************************************************************************
	 CONSTRUCTOR
	 ******************************************************************************/
	construct: function (facade) {
		this.base(arguments);
		this.facade = facade;

		this.parentNode = facade.getCanvas().getSvgContainer();

		// The parent Node
		this.node = ms123.oryx.Editor.graft("http://www.w3.org/2000/svg", this.parentNode, ['g']);

		this.highlightNodes = {};

		facade.registerOnEvent(ms123.oryx.Config.EVENT_HIGHLIGHT_SHOW, this.setHighlight.bind(this));
		facade.registerOnEvent(ms123.oryx.Config.EVENT_HIGHLIGHT_HIDE, this.hideHighlight.bind(this));

	},


	/******************************************************************************
	 PROPERTIES
	 ******************************************************************************/
	properties: {},

	/******************************************************************************
	 STATICS
	 ******************************************************************************/
	statics: {},
	/******************************************************************************
	 MEMBERS
	 ******************************************************************************/
	members: {
		setHighlight: function (options) {
			if (options && options.highlightId) {
				var node = this.highlightNodes[options.highlightId];

				if (!node) {
					node = ms123.oryx.Editor.graft("http://www.w3.org/2000/svg", this.node, ['path',
					{
						"stroke-width": 2.0,
						"fill": "none"
					}]);

					this.highlightNodes[options.highlightId] = node;
				}

				if (options.elements && options.elements.length > 0) {

					this.setAttributesByStyle(node, options);
					this.show(node);

				} else {

					this.hide(node);

				}

			}
		},

		hideHighlight: function (options) {
			if (options && options.highlightId && this.highlightNodes[options.highlightId]) {
				this.hide(this.highlightNodes[options.highlightId]);
			}
		},

		hide: function (node) {
			node.setAttributeNS(null, 'display', 'none');
		},

		show: function (node) {
			node.setAttributeNS(null, 'display', '');
		},

		setAttributesByStyle: function (node, options) {

			// If the style say, that it should look like a rectangle
			if (options.style && options.style == ms123.oryx.Config.SELECTION_HIGHLIGHT_STYLE_RECTANGLE) {

				// Set like this
				var bo = options.elements[0].absoluteBounds();

				var strWidth = options.strokewidth ? options.strokewidth : ms123.oryx.Config.BORDER_OFFSET

				node.setAttributeNS(null, "d", this.getPathRectangle(bo.a, bo.b, strWidth));
				node.setAttributeNS(null, "stroke", options.color ? options.color : ms123.oryx.Config.SELECTION_HIGHLIGHT_COLOR);
				node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 0.2);
				node.setAttributeNS(null, "stroke-width", strWidth);

			} else if (options.elements.length == 1 && options.elements[0] instanceof ms123.oryx.core.Edge && options.highlightId != "selection") {

				/* Highlight containment of edge's childs */
				node.setAttributeNS(null, "d", this.getPathEdge(options.elements[0].dockers));
				node.setAttributeNS(null, "stroke", options.color ? options.color : ms123.oryx.Config.SELECTION_HIGHLIGHT_COLOR);
				node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 0.2);
				node.setAttributeNS(null, "stroke-width", ms123.oryx.Config.OFFSET_EDGE_BOUNDS);

			} else {
				// If not, set just the corners
				node.setAttributeNS(null, "d", this.getPathByElements(options.elements));
				node.setAttributeNS(null, "stroke", options.color ? options.color : ms123.oryx.Config.SELECTION_HIGHLIGHT_COLOR);
				node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 1.0);
				node.setAttributeNS(null, "stroke-width", options.strokewidth ? options.strokewidth : 2.0);

			}
		},

		getPathByElements: function (elements) {
			if (!elements || elements.length <= 0) {
				return undefined
			}

			// Get the padding and the size
			var padding = ms123.oryx.Config.SELECTED_AREA_PADDING;

			var path = ""

			// Get thru all Elements
			elements.each((function (element) {
				if (!element) {
					return
				}
				// Get the absolute Bounds and the two Points
				var bounds = element.absoluteBounds();
				bounds.widen(padding)
				var a = bounds.upperLeft();
				var b = bounds.lowerRight();

				path = path + this.getPath(a, b);

			}).bind(this));

			return path;

		},

		getPath: function (a, b) {

			return this.getPathCorners(a, b);

		},

		getPathCorners: function (a, b) {

			var size = ms123.oryx.Config.SELECTION_HIGHLIGHT_SIZE;

			var path = ""

			// Set: Upper left 
			path = path + "M" + a.x + " " + (a.y + size) + " l0 -" + size + " l" + size + " 0 ";
			// Set: Lower left
			path = path + "M" + a.x + " " + (b.y - size) + " l0 " + size + " l" + size + " 0 ";
			// Set: Lower right
			path = path + "M" + b.x + " " + (b.y - size) + " l0 " + size + " l-" + size + " 0 ";
			// Set: Upper right
			path = path + "M" + b.x + " " + (a.y + size) + " l0 -" + size + " l-" + size + " 0 ";

			return path;
		},

		getPathRectangle: function (a, b, strokeWidth) {

			var size = ms123.oryx.Config.SELECTION_HIGHLIGHT_SIZE;

			var path = ""
			var offset = strokeWidth / 2.0;

			// Set: Upper left 
			path = path + "M" + (a.x + offset) + " " + (a.y);
			path = path + " L" + (a.x + offset) + " " + (b.y - offset);
			path = path + " L" + (b.x - offset) + " " + (b.y - offset);
			path = path + " L" + (b.x - offset) + " " + (a.y + offset);
			path = path + " L" + (a.x + offset) + " " + (a.y + offset);

			return path;
		},

		getPathEdge: function (edgeDockers) {
			var length = edgeDockers.length;
			var path = "M" + edgeDockers[0].bounds.center().x + " " + edgeDockers[0].bounds.center().y;

			for (var i = 1; i < length; i++) {
				var dockerPoint = edgeDockers[i].bounds.center();
				path = path + " L" + dockerPoint.x + " " + dockerPoint.y;
			}

			return path;
		}

	},
	/******************************************************************************
	 DESTRUCTOR
	 ******************************************************************************/
	destruct: function () {}

});
