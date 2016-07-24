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
	@ignore($)
	@ignore(TreeModel)
	@asset(qx/icon/${qx.icontheme}/16/actions/*)
	@asset(qx/icon/${qx.icontheme}/16/places/*)
*/

/**
 */
qx.Class.define( "ms123.shell.views.StructureEditor", {
	extend: qx.ui.container.Composite,

	/******************************************************************************
	 CONSTRUCTOR
	 ******************************************************************************/
	construct: function( context ) {
		this.base( arguments );
		var model = context.model;
		this._model = model;
		this._etdata = null;
		this.storeDesc = context.storeDesc;
		this._createLevelList();
		this._createUseList();
		qx.Class.include( qx.ui.treevirtual.TreeVirtual, qx.ui.treevirtual.MNode );

		var columnmodel = this._createColumnModel();
		var table = this._createTable( columnmodel );
		this._doLayout( table, columnmodel );
	},
	/******************************************************************************
	 EVENTS
	 ******************************************************************************/
	events: {
		"save": "qx.event.type.Data"
	},

	/******************************************************************************
	 MEMBERS
	 ******************************************************************************/
	members: {
		init: function( content ) {
			var arr = null;
			if ( content.match( /^ *[\[{]/ ) ) {
				arr = window.hjson.parse( content );
			} else {
				arr = window.yaml.load( content );
			}

			var dataModel = this._dataModel;
			var tree = this._table;
			tree.setRowHeight( 24 );

			var tm = new TreeModel();
			var root = tm.parse( {
				children: arr
			} );
			var map = {};
			root.walk( ( function( node ) {
				if ( node.model.name == null ) return true;
				var path = this._getPath( node.getPath() );
				var isLeaf = !node.hasChildren();
				var parentTreeNode = node.parent ? map[ this._getPath( node.parent.getPath() ) ] : 0;
				var treeNode = null;
				if ( isLeaf ) {
					treeNode = dataModel.addLeaf( parentTreeNode, this._getTitle( node ) );
				} else {
					treeNode = dataModel.addBranch( parentTreeNode, this._getTitle( node ), parentTreeNode == 0 ? true : false );
					map[ path ] = treeNode;
				}
				this._setNodeData( treeNode, node.model );
				return true;
			} ).bind( this ) );

			dataModel.setData();
		},
		/**
		---------------------------------------------------------------------------
		   COLUMNMODEL
		---------------------------------------------------------------------------
		*/
		_createColumnModel: function() {
			var columnmodel = [ {
				name: "title_tr",
				type: "TextField",
				width: 180,
				label: "x"
			}, {
				name: "title",
				type: "TextField",
				width: 120,
				label: this.tr( "structure.title" )
			}, {
				name: "description",
				type: "TextField",
				label: this.tr( "structure.description" ),
				width: 60,
				'value': ""
			}, {
				name: "uri",
				type: "TextField",
				label: this.tr( "structure.uri" ),
				width: 120,
				validation: {
					//			required: true
				},
				'value': ""
			}, {
				name: "icon",
				type: "TextField",
				label: this.tr( "structure.icon" ),
				width: 40,
				'value': ""
			}, {
				name: "use",
				type: "SelectBox",
				width: 15,
				value: "m",
				readonly: false,
				options: this._useList,
				label: this.tr( "structure.use" )
			}, {
				name: "enabled",
				type: "CheckBox",
				value: true,
				width: 5,
				label: this.tr( "structure.enabled" )
			} ];
			this._columnModel = this._translate( columnmodel );
			this._columnMap = {};
			for ( var i = 0; i < this._columnModel.length; i++ ) {
				var name = this._columnModel[ i ].name;
				this._columnMap[ name ] = i;
			}
			return this._columnModel;
		},
		_createUseList: function() {
			this._useList = [ {
				"value": "m",
				"label": "Menu"
			}, {
				"value": "md",
				"label": "Menu,Doc"
			} ];
		},
		_createLevelList: function() {
			this._levelList = [ {
				"value": "2",
				"label": "=="
			}, {
				"value": "3",
				"label": "==="
			}, {
				"value": "4",
				"label": "===="
			}, {
				"value": "5",
				"label": "====="
			} ];
		},
		_translate: function( o ) {
			if ( typeof o == "string" ) {
				if ( o.match( /^%/ ) ) {
					var tr = this.tr( o.substring( 1 ) ).toString();
					if ( tr ) {
						o = tr;
					}
				}
				return o;
			}
			for ( var i in o ) {
				if ( typeof o[ i ] == "function" ) continue;
				o[ i ] = this._translate( o[ i ] );
			}
			return o;
		}
	},
		/**
		---------------------------------------------------------------------------
		   DRAG & DROP
		---------------------------------------------------------------------------
		*/
		_on_dragstart: function( e ) {
			this.__dragsession = true;
		},

		_on_dragend: function( e ) {
			this.__dragsession = false;
		},

		_on_drop: function( e ) {
			if ( e.supportsType( "qx/treevirtual-node" ) ) {
				this._table.moveNode( e );
			}
		},

		/**
		---------------------------------------------------------------------------
		   DATAMODEL ACCESS
		---------------------------------------------------------------------------
		*/
		_colIndex: function( name ) {
			return this._columnMap[ name ];
		},
		_getPath: function( arr ) {
			var ret = "";
			for ( var i = 0; i < arr.length; i++ ) {
				if ( arr[ i ].model.name ) {
					ret += "/" + arr[ i ].model.name;
				}
			}
			return ret;
		},
		_getTitle: function( node ) {
			if ( !node.model ) {
				return this.tr( node.title_tr );
			}
			if ( node.model.name ) {
				return this.tr( node.model.name );
			}
			return "";
		},
		_getDefaultValues: function() {
			var fdata = {};
			for ( var i = 0; i < this._columnModel.length; i++ ) {
				var col = this._columnModel[ i ];
				fdata[ col.name ] = col.value;
			}
			return fdata;
		},
		_setNodeData: function( nodeId, _data ) {
			var data = this._getDefaultValues();
			qx.lang.Object.mergeWith( data, _data, true );
			for ( var i = 0; i < this._columnModel.length; i++ ) {
				var name = this._columnModel[ i ].name;
				this._dataModel.setColumnData( nodeId, i, data[ name ] );
			}
			if ( data.url ) {
				this._dataModel.setColumnData( nodeId, this._colIndex( "uri" ), data.url );
			}
			if ( _data.disabled === true ) {
				this._dataModel.setColumnData( nodeId, this._colIndex( "enabled" ), false );
			}
			if ( data.name ) {
				this._dataModel.setColumnData( nodeId, this._colIndex( "title" ), data.name );
			}
		},
		_getNodeData: function( nodeId ) {
			var data = {};
			for ( var i = 0; i < this._columnModel.length; i++ ) {
				var name = this._columnModel[ i ].name;
				data[ name ] = this._dataModel.getColumnData( nodeId, i );
			}
			return data;
		},
		_deleteRecordAtPos: function( pos ) {
			var dataModel = this._dataModel;
			var node = dataModel.getNode( pos );
			dataModel.prune( node, true );
			dataModel.setData();
		},
		_addRecordAtPos: function( pos, data ) {
			var dataModel = this._dataModel;
			var node = pos ? dataModel.getNode( pos ) : {};
			var pnode = node.parentNodeId || 0;
			var newNode = null;
			if ( data.uri == null || data.uri == "" ) {
				newNode = dataModel.addLeaf( pnode, this.tr( data.title ) );
			} else {
				newNode = dataModel.addBranch( pnode, this.tr( data.title ), pnode == 0 ? true : false );
			}
			this._setNodeData( newNode, data );
			dataModel.setData();
		},
		_setRecordAtPos: function( pos, data ) {
			var node = this._dataModel.getNode( pos );
			this._setNodeData( node.nodeId, data );
			node.label = this.tr( data.title );
			this._dataModel.setData();
		},
		_getRecordAtPos: function( pos ) {
			var node = this._dataModel.getNode( pos );
			var nodeId = node.nodeId;
			var data = this._getDefaultValues();
			var ndata = this._getNodeData( nodeId );
			qx.lang.Object.mergeWith( data, ndata );
			data.title_tr = node.label;
			return data;
		},
		/**
		---------------------------------------------------------------------------
		   LAYOUT
		---------------------------------------------------------------------------
		*/
		_doLayout: function( table, columnmodel ) {
			this.setLayout( new qx.ui.layout.Dock() );
			this.add( table, {
				edge: "center"
			} );
			var tb = this._createToolbar();
			this.add( tb, {
				edge: "south"
			} );

			var sp = this._createGlobalForm();
			this.add( sp, {
				edge: "north"
			} );
		},
		_createGlobalForm: function() {
			var formData = {
				"description": {
					'type': "TextField",
					'label': this.tr( "structure.description" ),
					'validation': {
						required: false
					},
					'value': ""
				}
			};

			var self = this;
			var form = new ms123.form.Form( {
				"tabs": [ {
					id: "tab1",
					layout: "single"
				} ],
				"useScroll": false,
				"formData": formData,
				"buttons": [],
				"inWindow": false,
				"context": self
			} );
			this._globalForm = form;
			if ( this._etdata ) {
				this._globalForm.setData( this._etdata );
			}
			return form;
		},

		/**
		---------------------------------------------------------------------------
		   TOOLBAR
		---------------------------------------------------------------------------
		*/
		_createToolbar: function() {
			var toolbar = new qx.ui.toolbar.ToolBar();

			this._buttonAdd = new qx.ui.toolbar.Button( "", "icon/16/actions/list-add.png" );
			this._buttonAdd.setToolTipText( this.tr( "button.new" ) );
			this._buttonAdd.addListener( "execute", function() {

				this._isEditMode = false;
				this._table.stopEditing();
				if ( !this._editForm ) {
					this._editForm = this._createEditForm( this._columnModel );
					this._editWindow = this._createEditWindow();
					this._editWindow.add( this._editForm );
				}
				this._configButtons();
				this._editForm.fillForm( this._getDefaultValues() );
				this._editWindow.setActive( true );
				this._editWindow.open();

			}, this );
			this._buttonAdd.setEnabled( true );
			toolbar._add( this._buttonAdd );

			this._buttonEdit = new qx.ui.toolbar.Button( "", "icon/16/apps/utilities-text-editor.png" );
			this._buttonEdit.setToolTipText( this.tr( "button.edit" ) );
			this._buttonEdit.addListener( "execute", function( e ) {
				this._table.stopEditing();

				this._isEditMode = true;
				var curRecord = this._getRecordAtPos( this._currentTableIndex );
				if ( !this._editForm ) {
					this._editForm = this._createEditForm( this._columnModel );
					this._editWindow = this._createEditWindow();
					this._editWindow.add( this._editForm );
				}
				this._configButtons();
				this._editForm.fillForm( curRecord );
				this._editWindow.setActive( true );
				this._editWindow.open();
			}, this );
			toolbar._add( this._buttonEdit );
			this._buttonEdit.setEnabled( false );



			this._buttonCopy = new qx.ui.toolbar.Button( "", "icon/16/actions/edit-copy.png" );
			this._buttonCopy.setToolTipText( this.tr( "ge.Edit.copy" ) );
			this._buttonCopy.addListener( "execute", function() {
				var curRecord = this._getRecordAtPos( this._currentTableIndex );
				this._insertRecordAtPos( curRecord, this._currentTableIndex + 1 );
			}, this );
			//toolbar._add( this._buttonCopy );
			this._buttonCopy.setEnabled( false );


			this._buttonDel = new qx.ui.toolbar.Button( "", "icon/16/actions/list-remove.png" );
			this._buttonDel.setToolTipText( this.tr( "ge.Edit.del" ) );
			this._buttonDel.addListener( "execute", function() {
				this._deleteRecordAtPos( this._currentTableIndex );
			}, this );
			toolbar._add( this._buttonDel );
			this._buttonDel.setEnabled( false );

			toolbar.setSpacing( 5 );
			toolbar.addSpacer();

			toolbar.add( new qx.ui.core.Spacer(), {
				flex: 1
			} );
			this._buttonSave = new qx.ui.toolbar.Button( this.tr( "meta.lists.savebutton" ), "icon/16/actions/document-save.png" );
			this._buttonSave.addListener( "execute", function() {
				this._save();
			}, this );
			this._buttonSave.setEnabled( true );
			toolbar._add( this._buttonSave );
			this._toolbar = toolbar;
			return toolbar;
		},
		/**
		---------------------------------------------------------------------------
		   TREETABLE
		---------------------------------------------------------------------------
		*/
		_createTable: function( tableColumns ) {
			var customMap = {
				tableColumnModel: function( obj ) {
					return new qx.ui.table.columnmodel.Resize( obj );
				}
			};
			var colArr = [];
			for ( var i = 0; i < this._columnModel.length; i++ ) {
				colArr.push( this._columnModel[ i ].label );
			}
			var table = new ms123.shell.views.DragDropTree( colArr, customMap );
			table.setEnableDragDrop( true );
			table.setStatusBarVisible( false );
			this._dataModel = table.getDataModel();

			table.addListener( "dragstart", this._on_dragstart, this );
			table.addListener( "dragend", this._on_dragend, this );
			table.addListener( "drop", this._on_drop, this );

			var tcm = table.getTableColumnModel();

			var booleanCellRendererFactory = new qx.ui.table.cellrenderer.Dynamic( this._booleanCellRendererFactoryFunc );
			var booleanCellEditorFactory = new qx.ui.table.celleditor.Dynamic( this._booleanCellEditorFactoryFunc );

			this._booleanCols = [];
			for ( var i = 0; i < tableColumns.length; i++ ) {
				var col = tableColumns[ i ];
				if ( col.type == "CheckBox" ) {
					tcm.setDataCellRenderer( i, booleanCellRendererFactory );
					tcm.setCellEditorFactory( i, booleanCellEditorFactory );
					table.getTableModel().setColumnEditable( i, true );
					this._booleanCols.push( i );
				}
				if ( col.type == "DoubleSelectBox" ) {
					tcm.setDataCellRenderer( i, new ms123.util.MultiValueRenderer() );
				}
				if ( col.type == "DateTimeField" ) {
					tcm.setDataCellRenderer( i, new ms123.util.DateRenderer() );
				}
				if ( col.type == "TextField" ) {
					var f = new ms123.util.TableCellTextField( col );
					tcm.setCellEditorFactory( i, f );
					table.getTableModel().setColumnEditable( i, true );
				}
				if ( col.type == "DecimalField" ) {
					var f = new ms123.ruleseditor.DecimalCellEditor();
					tcm.setCellEditorFactory( i, f );
					table.getTableModel().setColumnEditable( i, true );
				}
				if ( col.type == "ComboBox" ) {
					var comboBox = new qx.ui.table.celleditor.ComboBox();
					var o = col.options;
					var listData = [];
					for ( var j = 0; j < o.length; j++ ) {
						var value = o[ j ].value;
						var option = [ value, null, value ];
						listData.push( option );
					}
					comboBox.setListData( listData );
					tcm.setCellEditorFactory( i, comboBox );
					table.getTableModel().setColumnEditable( i, true );
				}
				if ( col.type == "SelectBox" ) {
					var r = new qx.ui.table.cellrenderer.Replace();
					var f = new qx.ui.table.celleditor.SelectBox();
					var listData = [];
					var o = col.options;
					var listData = [];
					for ( var j = 0; j < o.length; j++ ) {
						var value = o[ j ]
						var label = value.label || value.value;
						var option = [ label, null, value.value ];
						listData.push( option );
					}
					f.setListData( listData );

					var replaceMap = {};
					listData.forEach( function( row ) {
						if ( row instanceof Array ) {
							replaceMap[ row[ 0 ] ] = row[ 2 ];
						}
					} );
					r.setReplaceMap( replaceMap );
					r.addReversedReplaceMap();
					tcm.setDataCellRenderer( i, r );

					tcm.setCellEditorFactory( i, f );
					table.getTableModel().setColumnEditable( i, true );
				}
				if ( col.readonly === true ) {
					table.getTableModel().setColumnEditable( i, false );
				}
				if ( col.width !== undefined ) {
					var resizeBehavior = tcm.getBehavior();
					resizeBehavior.setMinWidth( i, col.width );
				}
			}
			this._table = table;
			this._dataModel = table.getTableModel();

			this._createTableListener( table );
			return table;
		},
		_createTableListener: function( table ) {
			table.addListener( 'dataEdited', function( e ) {
				var data = e.getData();
				if ( data.col != this._colIndex( "title" ) ) {
					return;
				}
				var node = this._dataModel.getNode( data.row );
				node.label = this.tr( data.value );
				this._dataModel.setData();
			}, this );

			var selModel = table.getSelectionModel();
			selModel.setSelectionMode( qx.ui.table.selection.Model.SINGLE_SELECTION );
			selModel.addListener( "changeSelection", function( e ) {

				var count = selModel.getSelectedCount();
				if ( count == 0 ) {
					if ( this._buttonEdit ) this._buttonEdit.setEnabled( false );
					if ( this._buttonDel ) this._buttonDel.setEnabled( false );
					if ( this._buttonCopy ) this._buttonCopy.setEnabled( false );
					return;
				}
				var index = selModel.getLeadSelectionIndex();
				this._currentTableIndex = index;
				this._currentNodeId = this._dataModel.getNodeFromRow( index );
				this._currentRowData = this._dataModel.getRowData( index );
				if ( this._buttonEdit ) this._buttonEdit.setEnabled( true );
				if ( this._buttonSave ) this._buttonSave.setEnabled( true );
				if ( this._buttonDel ) this._buttonDel.setEnabled( true );
				if ( this._buttonCopy ) this._buttonCopy.setEnabled( true );
			}, this );
		},
		_booleanCellRendererFactoryFunc: function( cellInfo ) {
			return new qx.ui.table.cellrenderer.Boolean;
		},
		_booleanCellEditorFactoryFunc: function( cellInfo ) {
			return new qx.ui.table.celleditor.CheckBox;
		},
		/**
		---------------------------------------------------------------------------
		   EDITFORM
		---------------------------------------------------------------------------
		*/
		_createEditForm: function() {
			var formData = {};
			for ( var i = 1; i < this._columnModel.length; i++ ) {
				var col = this._columnModel[ i ];
				formData[ col.name ] = col;
			}
			var self = this;
			var buttons = [ {
				'label': this.tr( "structure.insert" ),
				'icon': "icon/22/actions/dialog-ok.png",
				'callback': this.formCallback.bind( this ),
				'value': "insert"
			}, {
				'label': this.tr( "structure.append" ),
				'icon': "icon/22/actions/dialog-ok.png",
				'callback': this.formCallback.bind( this ),
				'value': "append"
			}, {
				'label': this.tr( "structure.update" ),
				'icon': "icon/22/actions/dialog-ok.png",
				'callback': this.formCallback.bind( this ),
				'value': "update"
			} ];

			var context = {};
			context.formData = formData;
			context.buttons = buttons;
			context.formLayout = [ {
				id: "tab1"
			} ];
			var form = new ms123.widgets.Form( context );
			return form;
		},
		_createEditWindow: function() {
			var win = new qx.ui.window.Window( "", "" ).set( {
				resizable: true,
				useMoveFrame: true,
				useResizeFrame: true
			} );
			win.setLayout( new qx.ui.layout.Grow );
			win.setWidth( 600 );
			win.setHeight( 300 );
			win.setAllowMaximize( false );
			win.setAllowMinimize( false );
			win.setModal( true );
			win.setActive( false );
			win.minimize();
			win.center();
			this.getApplicationRoot().add( win );
			return win;
		},
		_configButtons: function() {
			var buttons = this._editForm.getButtons();
			var keys = Object.keys( buttons );
			keys.forEach( function( key ) {
				buttons[ key ].setVisibility( "visible" );
			} );
			if ( this._currentTableIndex == null ) {
				buttons[ "insert" ].exclude();
				buttons[ "update" ].exclude();
			} else if ( this._currentTableIndex >= 0 ) {
				buttons[ "append" ].exclude();
			}
			if ( this._isEditMode ) {
				buttons[ "insert" ].exclude();
				buttons[ "append" ].exclude();
			} else {
				buttons[ "update" ].exclude();
			}
		},
		formCallback: function( m, v ) {
			var form = this._editForm;
			var win = this._editWindow;
			var validate = form.validate();
			console.error( "validate:" + validate );
			if ( !validate ) {
				var vm = form.getValidationManager();
				var items = vm.getInvalidFormItems();
				for ( var i = 0; i < items.length; i++ ) {
					items[ i ].setValid( false );
				}
				ms123.form.Dialog.alert( this.tr( "widgets.table.form_incomplete" ) );
				return;
			}
			var map = {};
			qx.lang.Object.mergeWith( map, m );
			if ( this._isEditMode ) {
				this._setRecordAtPos( this._currentTableIndex, m );
				win.close();
			} else {
				var index = null;
				if ( this._currentTableIndex >= 0 ) {
					if ( v == "insert" ) {
						index = this._currentTableIndex;
					}
				}
				this._addRecordAtPos( index, m );
				form.fillForm( this._getDefaultValues() );
			}
		},
		/**
		---------------------------------------------------------------------------
		   SAVE/LOAD
		---------------------------------------------------------------------------
		*/
		_save: function() {
			this._table.stopEditing();
			var data = this._getRecords();
			console.log( "Data:" + JSON.stringify( data, null, 2 ) );
			this.fireDataEvent( "save", JSON.stringify( data, null, 2 ) );
		},
		_load: function() {
			return [];
		}
} );
