/*
 * This file is part of SIMPL4(http://simpl4.org).
 *
 * 	Copyright [2014] [Manfred Sattler] <manfred@ms123.org>
 *
 * SIMPL4 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SIMPL4 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SIMPL4.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @ignore(OpenSeadragon.*)
 * @ignore(jQuery.*)
 */
qx.Class.define('ms123.bomviewer.ImageViewer', {
	extend: qx.ui.container.Composite,
	implement: ms123.bomviewer.IDrawingViewer,

	construct: function (context) {
		this.base(arguments);
		this.setLayout(new qx.ui.layout.Dock());
		this._openSeadragon = null;
		this.addListenerOnce('appear', function () {
			var el = this.getContentElement().getDomElement();
			console.log("ImageViewer.appear");
			this._openSeadragon = OpenSeadragon({
				hash: "hash_" + this,
				element: el,
				prefixUrl: "/sw/resource/openseadragon/",
				zoomPerClick: 2.0,
				autoHideControls: false,
				navigatorMaintainSizeRatio:true,
				navigatorSizeRatio:0.22,
				navigatorPosition: 'BOTTOM_LEFT',
				showNavigator: true
			});
			if (context.url) {
				this.open(context.url, context.hotspots);
			}

			this._openSeadragon.addHandler("open", this._addOverlays.bind(this));
			var viewerInputHook = this._openSeadragon.addViewerInputHook({
				hooks: [{
					tracker: 'viewer',
					handler: 'clickHandler',
					hookHandler: this.onViewerClick.bind(this)
				}]
			});
		}, this);
	},

	properties: {},
	events: {
		"hotspot": "qx.event.type.Data"
	},
	members: {
		open: function (url, hotspots, scale) {
			this._hotspots = hotspots;
			var map = this._getParameter(url);
			this._openSeadragon.open({
				width: map.width,
				height: map.height,
				tileSize: 256,
				getTileUrl: function (level, x, y) {
					return "/sw/resource/deep/SD_" + url + "/" + level + "/" + x + "_" + y + ".png";
				}
			});
		},
		close: function () {
			this._openSeadragon.close();
		},
		selectHotspot: function (href, intern) {
			this._selectHotspot(href, false);
		},
		destroy: function () {
			this._openSeadragon.destroy();
		},
		_selectHotspot: function (href, intern) {
			if (this.internalHotspotEvent === true) return;
			var el = this.getContentElement().getDomElement();
			var elems = el.getElementsByClassName("hotspot");
			var firstSelected = null;
			for (var i = 0; i < elems.length; i++) {
				var e = elems[i];
				jQuery(e).removeClass("selected");
				var data = e["$$hotspot"];
				if (data && data.href == href) {
					jQuery(e).addClass("selected");
					if (!firstSelected) {
						firstSelected = e;
					}
				}
			}
			if (!intern && firstSelected) {
				var e = firstSelected;
				var data = e["$$hotspot"];
				var offsetY = e.offsetTop + e.clientTop;
				var offsetX = e.offsetLeft + e.clientLeft;
				this._openSeadragon.viewport.panTo(data.p, true);
			}
		},
		_addOverlays: function (ev) {
			console.log("addOverlays:", ev);
			var viewer = ev.eventSource;
			var hsList = this._hotspots;
			for (var i = 0; i < hsList.length; i++) {
				var hs = hsList[i];
				var rect = hs.coords.split(",");
				var f = 5.0;
				var c = 0;
				var x = rect[0] * f;
				var y = rect[1] * f;
				var w = (rect[2] - rect[0] + 2) * f;
				var h = (rect[3] - rect[1] + 2) * f;
				var rec = viewer.viewport.imageToViewportRectangle(x, y, w, h);
				var p = viewer.viewport.imageToViewportCoordinates(x, y);
				var div = this.createDiv(hs.href, p);
				viewer.drawer.addOverlay(div, rec);

			}
		},
		createDiv: function (href, p) {
			var div = document.createElement("div");
			div.className = "hotspot";
			div['$$hotspot'] = {
				p: p,
				href: href
			};
			return div;
		},

		onViewerClick: function (event) {
			var e = event.originalEvent;
			var target = e.target || e.srcElement;
			console.log("clickHandler:", event);
			console.log("srcElement:" + target['$$hotspot']);
			if (target['$$hotspot']) {
				event.preventDefaultAction = true;
				event.stopBubbling = true;
				var data = target['$$hotspot'];

				this._selectHotspot(data.href, true);
				this.internalHotspotEvent = true;
				this.fireDataEvent("hotspot", data, null);
				this.internalHotspotEvent = false;


			}
			event.preventDefaultAction = true;
		},

		_getParameter: function (part) {

			var map = {
				'123490603': {
					width: 5263,
					height: 3719
				},
				'123551000': {
					width: 5263,
					height: 3719
				},
				'123555401': {
					width: 5263,
					height: 3719
				},
				'123565300': {
					width: 5263,
					height: 3719
				},
				'124451600': {
					width: 4950,
					height: 3825
				},
				'124665200': {
					width: 4950,
					height: 3825
				},
				'124665600': {
					width: 5263,
					height: 3719
				},
				'124665700': {
					width: 4950,
					height: 3825
				},
				'124751400': {
					width: 5263,
					height: 3719
				},
				'124769600': {
					width: 4950,
					height: 3825
				},
				'125429200': {
					width: 5263,
					height: 3719
				},
				'125684601': {
					width: 4950,
					height: 3825
				},
				'125684602': {
					width: 4950,
					height: 3825
				},
				'127323700': {
					width: 5263,
					height: 3719
				},
				'128486700': {
					width: 5263,
					height: 3719
				},
				'129729000': {
					width: 4950,
					height: 3825
				},
				'132818800': {
					width: 5263,
					height: 3719
				},
				'132885800': {
					width: 4950,
					height: 3825
				},
				'133294500': {
					width: 5263,
					height: 3719
				},
				'133336500': {
					width: 5263,
					height: 3719
				},
				'133424600': {
					width: 5263,
					height: 3719
				},
				'133682500': {
					width: 4950,
					height: 3825
				},
				'133777000': {
					width: 5263,
					height: 3719
				},
				'133793603': {
					width: 7444,
					height: 5263
				},
				'133967200': {
					width: 5263,
					height: 3719
				},
				'133971600': {
					width: 5263,
					height: 3719
				},
				'133974300': {
					width: 4950,
					height: 3825
				},
				'133974600': {
					width: 4950,
					height: 3825
				},
				'133999600': {
					width: 5263,
					height: 3719
				},
				'134000600': {
					width: 5263,
					height: 3719
				},
				'134000601': {
					width: 5263,
					height: 3719
				},
				'134006000': {
					width: 5263,
					height: 3719
				},
				'134006001': {
					width: 5263,
					height: 3719
				},
				'134102600': {
					width: 5263,
					height: 3719
				},
				'134179500': {
					width: 5263,
					height: 3719
				},
				'134413200': {
					width: 4950,
					height: 3825
				},
				'134777700': {
					width: 4950,
					height: 3825
				},
				'134861900': {
					width: 5263,
					height: 3719
				},
				'134953200': {
					width: 5263,
					height: 3719
				},
				'135096200': {
					width: 5263,
					height: 3719
				},
				'135161500': {
					width: 4950,
					height: 3825
				},
				'135224600': {
					width: 4950,
					height: 3825
				},
				'135234600': {
					width: 4950,
					height: 3825
				},
				'135450200': {
					width: 5263,
					height: 3719
				},
				'136421400': {
					width: 5263,
					height: 3719
				},
				'136421800': {
					width: 5263,
					height: 3719
				},
				'136924204': {
					width: 3831,
					height: 2394
				},
				'137421800': {
					width: 4950,
					height: 3825
				},
				'137756400': {
					width: 5263,
					height: 3719
				},
				'138412000': {
					width: 5263,
					height: 3719
				},
				'139094200': {
					width: 5263,
					height: 3719
				},
				'140645400': {
					width: 4950,
					height: 3825
				},
				'140755100': {
					width: 5263,
					height: 3719
				},
				'140755101': {
					width: 4950,
					height: 3825
				},
				'140763300': {
					width: 4950,
					height: 3825
				},
				'140763301': {
					width: 5263,
					height: 3719
				},
				'140779200': {
					width: 3831,
					height: 2394
				},
				'140833100': {
					width: 5263,
					height: 3719
				},
				'140833200': {
					width: 5263,
					height: 3719
				},
				'141012800': {
					width: 5263,
					height: 3719
				},
				'141027500': {
					width: 3844,
					height: 2394
				},
				'141027600': {
					width: 3844,
					height: 2394
				},
				'141027700': {
					width: 3844,
					height: 2394
				},
				'141027800': {
					width: 3831,
					height: 2388
				},
				'141027900': {
					width: 3844,
					height: 2394
				},
				'141042700': {
					width: 4950,
					height: 3825
				},
				'141078500': {
					width: 5263,
					height: 3719
				},
				'141078600': {
					width: 5263,
					height: 3719
				},
				'141078900': {
					width: 5263,
					height: 3719
				},
				'141216100': {
					width: 4950,
					height: 3825
				},
				'141363400': {
					width: 3831,
					height: 2394
				},
				'141363500': {
					width: 5263,
					height: 3719
				},
				'141371000': {
					width: 3831,
					height: 2388
				},
				'141371800': {
					width: 5263,
					height: 3719
				},
				'141378900': {
					width: 3831,
					height: 2394
				},
				'141379300': {
					width: 5263,
					height: 3719
				},
				'142080900': {
					width: 4950,
					height: 3825
				},
				'145023400': {
					width: 5263,
					height: 3719
				},
				'145028200': {
					width: 5263,
					height: 3719
				},
				'145651400': {
					width: 5263,
					height: 3719
				},
				'145661000': {
					width: 4950,
					height: 3825
				},
				'2100097': {
					width: 3831,
					height: 2388
				}
			}
			return map[part];
		}
	}
});
