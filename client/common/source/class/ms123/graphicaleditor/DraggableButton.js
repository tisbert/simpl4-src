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
/** **********************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * The normal toolbar button. Like a normal {@link qx.ui.form.Button}
 * but with a style matching the toolbar and without keyboard support.
 */
qx.Class.define("ms123.graphicaleditor.DraggableButton", {
	extend: qx.ui.form.Button,



/*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

	construct: function (label, icon, command) {
		this.base(arguments, label, icon, command);
		this.setDecorator(null);

		// Toolbar buttons should not support the keyboard events
		this.removeListener("keydown", this._onKeyDown);
		this.removeListener("keyup", this._onKeyUp);
		this.removeListener("pointerdown", this._onPointerDown);
		this.addListener("pointerdown", this.__onPointerDown);
	},




/*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

	properties: {
		appearance: {
			refine: true,
			init: "toolbar-button"
		},

		show: {
			refine: true,
			init: "inherit"
		},

		focusable: {
			refine: true,
			init: false
		}
	},


	/**
	 * ****************************************************************************
	 * MEMBERS
	 * ****************************************************************************
	 */
	members: {
		__onPointerDown: function (e) {
			if (!e.isLeftPressed()) {
				return;
			}

			//  e.stopPropagation();
			// Activate capturing if the button get a mouseout while
			// the button is pressed.
			this.capture();

			this.removeState("abandoned");
			this.addState("pressed");
		}

	}

});
