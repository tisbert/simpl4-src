/**
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
package org.ms123.common.data;

import flexjson.JSONDeserializer;
import flexjson.JSONSerializer;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.*;
import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ValidatorFactory;
import org.ms123.common.entity.api.EntityService;
import org.ms123.common.setting.api.SettingService;
import static org.ms123.common.setting.api.Constants.TITLEEXPRESSION;
import static org.ms123.common.setting.api.Constants.RECORDVALIDATION;
import static org.ms123.common.setting.api.Constants.NORESULTSETCOUNT;
import static org.ms123.common.setting.api.Constants.STATESELECT;
import static org.ms123.common.setting.api.Constants.SELECTDISTINCT;
import static org.ms123.common.setting.api.Constants.GLOBAL_SETTINGS;
import static org.ms123.common.entity.api.Constants.STATE_OK;
import static org.ms123.common.entity.api.Constants.STATE_NEW;
import static org.ms123.common.entity.api.Constants.STATE_FIELD;
import static org.ms123.common.entity.api.Constants.DISABLE_STATESELECT;
import com.tinkerpop.blueprints.impls.orient.OrientGraph;
import com.tinkerpop.blueprints.impls.orient.OrientGraphNoTx;
import com.tinkerpop.blueprints.impls.orient.OrientGraphFactory;
import org.ms123.common.data.api.SessionContext;
import org.ms123.common.auth.api.AuthService;
import org.ms123.common.utils.annotations.RelatedTo;
import org.ms123.common.data.query.QueryBuilder;
import org.ms123.common.data.query.OrientDBQueryBuilder;
import org.ms123.common.store.StoreDesc;
import org.ms123.common.permission.api.PermissionService;
import org.ms123.common.permission.api.PermissionException;
import org.ms123.common.libhelper.Inflector;
import org.ms123.common.git.GitService;
import org.ms123.common.system.orientdb.OrientDBService;
import org.ms123.common.domainobjects.api.DomainObjectsService;
import aQute.bnd.annotation.metatype.*;
import aQute.bnd.annotation.component.*;
import java.lang.UnsupportedOperationException;
import javax.servlet.http.*;
import static org.joor.Reflect.*;
import static com.jcabi.log.Logger.info;
import static com.jcabi.log.Logger.debug;
import static com.jcabi.log.Logger.error;

@SuppressWarnings("unchecked")
@Component(enabled = true, configurationPolicy = ConfigurationPolicy.optional, immediate = true, properties = { "kind=orientdb,name=dataLayer" })
public class OrientDBLayerImpl extends BaseOrientDBLayerImpl implements org.ms123.common.data.api.DataLayer {

	private EntityService entityService;

	private AuthService authService;

	private GitService gitService;

	private OrientDBService orientdbService;

	private SettingService settingService;

	private DomainObjectsService domainObjectsService;

	private PermissionService permissionService;

	private JSONSerializer js = new JSONSerializer();

	private JSONDeserializer ds = new JSONDeserializer();

	protected Inflector inflector = Inflector.getInstance();

	public void activate() {
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//insert 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public Map insertObject(Map dataMap, StoreDesc sdesc, String entityName) {
		return insertObject(dataMap, null, null, sdesc, entityName, null, null);
	}

	public Map insertObject(Map dataMap, StoreDesc sdesc, String entityName, String entityNameParent, String idParent) {
		return insertObject(dataMap, null, null, sdesc, entityName, entityNameParent, idParent);
	}

	public Map insertObject(Map dataMap, Map filterMap, Map hintsMap, StoreDesc sdesc, String entityName, String entityNameParent, String idParent) {
		debug(this,"insertObject:" + dataMap + ",filterMap:" + filterMap + ",entity:" + entityName + "/entityNameParent:" + entityNameParent + "/idParent:" + idParent);
		Map retMap = new HashMap();
		SessionContext sessionContext = getSessionContext(sdesc);
		try {
			retMap = insertObject(sessionContext, dataMap, filterMap, hintsMap, entityName, entityNameParent, idParent);
		} catch (Throwable e) {
		//	sessionContext.handleException(ut, e);
		} finally {
		//	sessionContext.handleFinally(ut);
		}
		return retMap;
	}

	public Map insertObject(SessionContext sessionContext, Map dataMap, String entityName) throws Exception {
		return insertObject(sessionContext, dataMap, null, null, entityName, null, null);
	}

	public Map insertObject(SessionContext sessionContext, Map dataMap, String entityName, String entityNameParent, String idParent) throws Exception {
		return insertObject(sessionContext, dataMap, null, null, entityName, entityNameParent, idParent);
	}

	public Map insertObject(SessionContext sessionContext, Map dataMap, Map hintsMap, String entityName, String entityNameParent, String idParent) throws Exception {
		return insertObject(sessionContext, dataMap, null, hintsMap, entityName, entityNameParent, idParent);
	}

	public Map insertObject(SessionContext sessionContext, Map dataMap, Map filterMap, Map hintsMap, String entityName, String entityNameParent, String idParent) throws Exception {
		return null;
	}
	

	public void makePersistent(Object objectInsert) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.makePersistent");
	}

	public void makePersistent(String namespace, Object objectInsert) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.makePersistent");
	}

	public void makePersistent(SessionContext sessionContext, Object objectInsert) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.makePersistent");
	}

	public List validateObject(SessionContext sessionContext, Object objectInsert) {
		return validateObject(sessionContext, objectInsert, null, true);
	}
	public List validateObject(SessionContext sessionContext, Object objectInsert, String entityName) {
		return validateObject(sessionContext, objectInsert, entityName, true);
	}

	public List validateObject(SessionContext sessionContext, Object objectInsert, String entityName, boolean bInsert) {
		return validateObject(sessionContext,objectInsert, null, entityName, bInsert);
	}
	public List validateObject(SessionContext sessionContext, Object objectInsert, Object objectUpdatePre, String entityName, boolean bInsert) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.validateObject");
	}

	public Object createObject(String namespace, String entityName) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.createObject");
	}

	public Object createObject(SessionContext sessionContext, String entityName) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.createObject");
	}

	public void insertIntoMaster(SessionContext sc, Object objectInsert, String entityName, Class masterClazz, String fieldName, Object masterId) throws Exception {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.createObject");
	}

	public void insertIntoMaster(SessionContext sc, Object objectInsert, String entityName, Object objectMaster, String fieldName) throws Exception {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.createObject");
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//update 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public Map updateObject(Map dataMap, StoreDesc sdesc, String entityName, String id) {
		return updateObject(dataMap, null, null, sdesc, entityName, id, null, null);
	}

	public Map updateObject(Map dataMap, Map filterMap, Map hintsMap, StoreDesc sdesc, String entityName, String id, String entityNameParent, String idParent) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.updateObject");
	}

	public Map updateObject(SessionContext sessionContext, Map dataMap, String entityName, String id) throws Exception {
		return updateObject(sessionContext, dataMap, null, null, entityName, id, null, null);
	}

	public Map updateObject(SessionContext sessionContext, Map dataMap, Map hintsMap, String entityName, String id) throws Exception {
		return updateObject(sessionContext, dataMap, null, hintsMap, entityName, id, null, null);
	}

	public Map updateObject(SessionContext sessionContext, Map dataMap, Map filterMap, Map hintsMap, String entityName, String id, String entityNameParent, String idParent) throws Exception {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.updateObject");
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//delete 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public Map deleteObject(Map dataMap, StoreDesc sdesc, String entityName, String id) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.deleteObject");
	}

	public Map deleteObject(SessionContext sessionContext, Map dataMap, String entityName, String id) throws Exception {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.deleteObject");
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//populate 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public void populate(Map from, Object to) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.populate");
	}

	public void populate(SessionContext sessionContext, Map from, Object to, Map hintsMap) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.populate");
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//get 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public Map getObject(StoreDesc sdesc, String entityName, String id) {
		return getObject(sdesc, entityName, id, null, null, null);
	}

	public Map getObject(StoreDesc sdesc, String entityName, String id, List fields) {
		return getObject(sdesc, entityName, id, null, fields, null);
	}

	public Map getObject(StoreDesc sdesc, String entityName, String id, String entityNameDetails, List fields) {
		return getObject(sdesc, entityName, id, entityNameDetails, fields, null);
	}

	public Map getObject(StoreDesc sdesc, String entityName, String id, String entityNameDetails, List fields, HttpServletResponse resp) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.getObject");
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	//query 
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	public Map query(Map params, StoreDesc sdesc, String entityName) {
		return query(params, sdesc, entityName, null, null);
	}

	public Map query(Map params, StoreDesc sdesc, String entityName, String idParent, String entityNameDetails) {
		SessionContext sessionContext = getSessionContext(sdesc);
		try {
			return query(sessionContext, params, sdesc, entityName, idParent, entityNameDetails);
		} catch (Exception e) {
			sessionContext.handleException(e);
		} finally {
			sessionContext.handleFinally();
		}
		return null;
	}

	public Map query(SessionContext sessionContext, Map params, StoreDesc sdesc, String entityName) {
		return query(sessionContext, params, sdesc, entityName, null, null);
	}

	public Map query(SessionContext sessionContext, Map params, StoreDesc sdesc, String entityName, String idParent, String entityNameDetails) {
		debug(this,"query:" + params + ",entityName:" + entityName + ",entityNameDetails:" + entityNameDetails + ",idParent:" + idParent ); 
		String config = sessionContext.getConfigName();
		checkPermissions(sdesc, sessionContext.getUserName(),entityName, null, "read");
		checkPermissions(sdesc, sessionContext.getUserName(),entityNameDetails, null, "read");
		entityName = this.inflector.getEntityName(entityName);
		Map retMap = new HashMap();
		Map filtersMap = null;
		if (params.get("filter") != null) {
			filtersMap = (Map) params.get("filter");
		}
		try{
			Map fieldSets = this.settingService.getFieldSets(config, sdesc.getNamespace(), entityName);
			QueryBuilder qb = new OrientDBQueryBuilder(sdesc, entityName, config, sessionContext, filtersMap, (Map) params, fieldSets);
			OrientGraphFactory factory = orientdbService.getFactory(sdesc.getNamespace(),false);
			OrientGraph orientGraph = factory.getTx();
			info(this,"orientGraph:"+orientGraph);
			String where = qb.getWhere();
			Class clazz = getClass(sessionContext, entityName);
			List<Map> rows = executeQuery(clazz, this.inflector.getClassName(entityName), where);
			retMap.put("rows", rows);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
		return retMap;
	}

	public Map querySql(SessionContext sessionContext, StoreDesc sdesc, Map params, String sql) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.querySql");
	}



	public Map getObjectGraph(StoreDesc sdesc, String entityName, String id) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.getObjectGraph");
	}

	public void evaluteFormulas(SessionContext sessionContext, String entityName, Map<String, Object> map, String direction) {
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.evaluteFormulas");
	}

	public synchronized SessionContext getSessionContext(String namespace) {
		return getSessionContext( StoreDesc.getNamespaceData(namespace));
	}

	public synchronized SessionContext getSessionContext(StoreDesc sdesc) {
		SessionContext sc = new OrientDBSessionContextImpl(this,sdesc,this.orientdbService);
		sc.setGitService(this.gitService);
		sc.setPermissionService(this.permissionService);
		sc.setSettingService(this.settingService);
		sc.setEntityService(this.entityService);
		return sc;
	}

	private void checkPermissions(StoreDesc sdesc, String user, String entityName, Map<String,Object> dataMap, String action) {
		if( entityName == null) return;
		entityName = this.inflector.getEntityName(entityName);
		debug(this,"checkPermissions:"+entityName+"/"+action+"/"+dataMap);
		boolean b = this.permissionService.hasEntityPermissions(sdesc, entityName, action);
		if( b ) return;
		throw new PermissionException("OrientDBLayer.checkPermissions(" + sdesc+"/entityName:"+entityName+"/action:"+action + ") not allowed");
	}

	public Class getClass(SessionContext sessionContext, String entityName) {
		StoreDesc sdesc = sessionContext.getStoreDesc();
		ClassLoader cl = this.domainObjectsService.getClassLoader( sdesc );
		String fqCN = sdesc.getPack()+"."+this.inflector.getClassName(entityName);
		info(this,"getClass("+cl+"):"+fqCN);
		try{
			return cl.loadClass( fqCN );
		}catch(ClassNotFoundException c){
			throw new RuntimeException("OrientDBLayer.getClass("+fqCN+") not found");
		}
	}

	public String constructEntityName(SessionContext sessionContext, String entityName, String entityNameParent){
		throw new UnsupportedOperationException("Not implemented:OrientDBLayer.constructEntityName");
	}

	/************************************ C O N V I N I E N T *************************************************/
	public Object getObjectById(String namespace, String entity, Object id){
		StoreDesc sdesc = StoreDesc.getNamespaceData(namespace);
		SessionContext sessionContext = getSessionContext(sdesc);
	  Class clazz = sessionContext.getClass(sdesc, entity);
		return sessionContext.getObjectById( clazz, id );
	}

	public Object getObjectByFilter(String namespace, String entity, String filter){
		StoreDesc sdesc = StoreDesc.getNamespaceData(namespace);
		SessionContext sessionContext = getSessionContext(sdesc);
	  Class clazz = sessionContext.getClass(sdesc, entity);
		return sessionContext.getObjectByFilter( clazz, filter );
	}
	public List<Object> getObjectsByFilter(String namespace, String entity, String filter){
		StoreDesc sdesc = StoreDesc.getNamespaceData(namespace);
		SessionContext sessionContext = getSessionContext(sdesc);
	  Class clazz = sessionContext.getClass(sdesc, entity);
		return sessionContext.getObjectsByFilter( clazz, filter );
	}
	public Object getObjectByNamedFilter(String namespace, String name, Map<String, Object> fparams){
		StoreDesc sdesc = StoreDesc.getNamespaceData(namespace);
		SessionContext sessionContext = getSessionContext(sdesc);
		return sessionContext.getObjectByNamedFilter( name, fparams );
	}
	public List<Object> getObjectsByNamedFilter(String namespace, String name, Map<String, Object> fparams){
		StoreDesc sdesc = StoreDesc.getNamespaceData(namespace);
		SessionContext sessionContext = getSessionContext(sdesc);
		return sessionContext.getObjectsByNamedFilter( name, fparams );
	}

	/************************************ C O N F I G ********************************************************/
	@Reference(dynamic = true, optional = true)
	public void setEntityService(EntityService paramEntityService) {
		this.entityService = paramEntityService;
		info(this,"OrientDBLayer.setEntityService:" + paramEntityService);
	}

	@Reference(dynamic = true, optional = true)
	public void setGitService(GitService paramGitService) {
		this.gitService = paramGitService;
		info(this,"OrientDBLayer.setGitService:" + paramGitService);
	}

	@Reference(dynamic = true)
	public void setPermissionService(PermissionService paramPermissionService) {
		this.permissionService = paramPermissionService;
		info(this,"OrientDBLayer.setPermissionService:" + paramPermissionService);
	}


	@Reference(dynamic = true, optional = true)
	public void setSettingService(SettingService paramSettingService) {
		this.settingService = paramSettingService;
		info(this,"OrientDBLayer.setSettingService:" + paramSettingService);
	}

	@Reference
	public void setOrientDBService(OrientDBService paramEntityService) {
		orientdbService = paramEntityService;
		info(this,"OrientDBLayer.setOrientDBService:" + paramEntityService);
	}

	@Reference
	public void setDomainObjectsService(DomainObjectsService  paramService) {
		domainObjectsService = paramService;
		info(this,"OrientDBLayer.setDomainObjectsService:" + paramService);
	}

	@Reference(dynamic = true, optional = true)
	public void setAuthService(AuthService paramAuthService) {
		this.authService = paramAuthService;
		info(this,"OrientDBLayer.setAuthService:" + paramAuthService);
	}
}