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
package org.ms123.common.wamp.camel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.camel.AsyncCallback;
import org.apache.camel.CamelContext;
import org.apache.camel.Exchange;
import org.apache.camel.ExchangePattern;
import org.apache.camel.impl.DefaultConsumer;
import org.apache.camel.Processor;
import org.apache.camel.util.ExchangeHelper;
import org.apache.commons.beanutils.ConvertUtils;
import org.ms123.common.permission.api.PermissionService;
import org.ms123.common.system.thread.ThreadContext;
import org.ms123.common.wamp.ApplicationError;
import org.ms123.common.wamp.Request;
import org.ms123.common.wamp.PubSubData;
import org.ms123.common.wamp.WampClientSession;
import rx.Subscription;
import static org.ms123.common.wamp.camel.WampClientConstants.*;
import static com.jcabi.log.Logger.info;
import static com.jcabi.log.Logger.debug;
import static com.jcabi.log.Logger.error;

@SuppressWarnings({ "rawtypes", "unchecked" })
public class WampClientConsumer extends DefaultConsumer {

	private final WampClientEndpoint endpoint;
	private WampClientSession clientSession;
	private Processor processor;
	private PermissionService permissionService;
	private ObjectMapper objectMapper = new ObjectMapper();
	protected static final Map<String, Class> types = new HashMap<String, Class>() {

		{
			put("string", java.lang.String.class);
			put("integer", java.lang.Integer.class);
			put("double", java.lang.Double.class);
			put("boolean", java.lang.Boolean.class);
			put("map", java.util.Map.class);
			put("list", java.util.List.class);
		}
	};

	public WampClientConsumer(WampClientEndpoint endpoint, Processor processor) {
		super(endpoint, processor);
		this.endpoint = endpoint;
		this.processor = processor;
	}

	private void wampClientConnected() {
/* $if version >= 1.8 $ */
		String namespace = endpoint.getCamelContext().getName().split("/")[0];
		String fqPrefix = endpoint.getCamelContext().getName().replace("/",".");
		info(this,"Consumer.register:" + fqPrefix + "." + endpoint.getProcedure()+"|fqPrefix:"+fqPrefix);
		String mode = endpoint.getMode();
		if( "rpc".equals(mode)){
			Subscription addProcSubscription = this.clientSession.registerProcedure(fqPrefix + "." + endpoint.getProcedure()).subscribe((request) -> {

				info(this,"Consumer.Procedure called:" + request + "/hashCode:" + this.hashCode());
				final boolean reply = false;
				final Exchange exchange = endpoint.createExchange(reply ? ExchangePattern.InOut : ExchangePattern.InOnly);
				try {
					prepareExchange(exchange, request);
				} catch (Exception e) {
					try {
						request.replyError("X", buildErrorResponse(e));
					} catch (Exception e2) {
						e2.printStackTrace();
					}
					return;
				}
				try {
					getAsyncProcessor().process(exchange, new AsyncCallback() {

						@Override
						public void done(boolean doneSync) {
							if (exchange.getException() != null) {
								try {
									request.replyError("XXXX", buildErrorResponse(exchange.getException()));
								} catch (Exception e) {
									e.printStackTrace();
								}
							} else {
								request.reply(null, buildResponse(getResult(exchange)));
							}
						}
					});
				} catch (Exception e) {
					e.printStackTrace();
					error(this, "process.error:%[exception]s",e);
				}
			});
		}
		if( "subscribe".equals(mode)){
			Subscription addSubscription = this.clientSession.makeSubscription(namespace + "." + endpoint.getTopic2()).subscribe((request) -> {

				info(this,"Consumer.Subscribe called:" + request + "/hashCode:" + this.hashCode());
				final boolean reply = false;
				final Exchange exchange = endpoint.createExchange(reply ? ExchangePattern.InOut : ExchangePattern.InOnly);
				try {
					prepareExchange(exchange, request);
				} catch (Exception e) {
					error(this, "prepareExchange.error:%[exception]s",e);
					return;
				}
				try {
					getAsyncProcessor().process(exchange, new AsyncCallback() {

						@Override
						public void done(boolean doneSync) {
							if (exchange.getException() != null) {
								error(this, "done.error:%[exception]s",exchange.getException());
							}
						}
					});
				} catch (Exception e) {
					error(this, "process.error:%[exception]s",e);

				}
			});
		}
/* $endif$ */
	}

	private void prepareExchange(Exchange exchange, Request request) {
		if (this.permissionService == null) {
			this.permissionService = getByType(exchange.getContext(), PermissionService.class);
		}
		Map<String, Object> methodParams = objectMapper.convertValue(request.keywordArguments(), Map.class);
		List<String> permittedRoleList = this.endpoint.getPermittedRoles();
		List<String> permittedUserList = this.endpoint.getPermittedUsers();
		String userName = getUserName();
		List<String> userRoleList = getUserRoles(userName);
		debug(this,"Consumer.prepare.userName:" + userName);
		debug(this,"Consumer.prepare.userRoleList:" + userRoleList);
		debug(this,"Consumer.prepare.permittedRoleList:" + permittedRoleList);
		debug(this,"Consumer.prepare.permittedUserList:" + permittedUserList);
		if (!isPermitted(userName, userRoleList, permittedUserList, permittedRoleList)) {
			throw new RuntimeException(PERMISSION_DENIED + ":User(" + userName + ") has no permission");
		}

		Map<String, Object> properties = new HashMap<>();
		Map<String, Object> headers = new HashMap<>();
		Map<String, Object> bodyMap = new HashMap<>();
		Object bodyObj = null;
		List<Map> paramList = this.endpoint.getParamList();
		int bodyCount = countBodyParams(paramList);
		for (Map param : paramList) {
			String destination = (String) param.get("destination");
			String name = (String) param.get("name");
			String destname = (String) param.get("destname");
			if( isEmpty(destname)){
				destname = name;
			}	
			Object def = param.get("defaultvalue");
			Class type = this.types.get((String) param.get("type"));
			Boolean opt = (Boolean) param.get("optional");
			if ("property".equals(destination)) {
				properties.put(destname, getValue(name, methodParams.get(name), def, opt, type));
			} else if ("header".equals(destination)) {
				headers.put(destname, getValue(name, methodParams.get(name), def, opt, type));
			} else if ("body".equals(destination)) {
				bodyObj = getValue(name, methodParams.get(name), def, opt, type);
				bodyMap.put(destname, bodyObj);
			}
		}

		if (bodyCount != 1) {
			if (bodyMap.keySet().size() > 0) {
				bodyObj = bodyMap;
			} else {
				bodyObj = null;
			}
		}
		//properties.put("__logExceptionsOnly", getBoolean(shape, "logExceptionsOnly", false));
		debug(this,"Consumer.prepare.methodParams:" + methodParams);
		debug(this,"Consumer.prepare.paramList:" + paramList);
		debug(this,"Consumer.prepare.properties:" + properties);
		debug(this,"Consumer.prepare.headers:" + headers);
		debug(this,"Consumer.prepare.body:" + bodyObj);

		exchange.getIn().setBody(bodyObj);
		exchange.getIn().setHeaders(headers);
		if (properties != null) {
			for (String key : properties.keySet()) {
				exchange.setProperty(key, properties.get(key));
			}
		}
	}

	private void prepareExchange(Exchange exchange, PubSubData data) {
		if (this.permissionService == null) {
			this.permissionService = getByType(exchange.getContext(), PermissionService.class);
		}
		List<String> permittedRoleList = this.endpoint.getPermittedRoles();
		List<String> permittedUserList = this.endpoint.getPermittedUsers();
		String userName = getUserName();
		List<String> userRoleList = getUserRoles(userName);
		debug(this,"Consumer.prepare.userName:" + userName);
		debug(this,"Consumer.prepare.userRoleList:" + userRoleList);
		debug(this,"Consumer.prepare.permittedRoleList:" + permittedRoleList);
		debug(this,"Consumer.prepare.permittedUserList:" + permittedUserList);
		if (!isPermitted(userName, userRoleList, permittedUserList, permittedRoleList)) {
			throw new RuntimeException(PERMISSION_DENIED + ":User(" + userName + ") has no permission");
		}
		exchange.getIn().setBody(objectMapper.convertValue( data.keywordArguments(), Map.class));
	}
	private Object getResult(Exchange exchange) {
		String returnSpec = this.endpoint.getRpcReturn();
		List<String> returnHeaderList = this.endpoint.getReturnHeaderList();
		Object camelBody = ExchangeHelper.extractResultBody(exchange, null);
		if ("body".equals(returnSpec)) {
			return ExchangeHelper.extractResultBody(exchange, null);
		} else if ("headers".equals(returnSpec)) {
			Map<String, Object> camelVarMap = new HashMap();
			for (Map.Entry<String, Object> header : exchange.getIn().getHeaders().entrySet()) {
				if (returnHeaderList.size() == 0 || returnHeaderList.contains(header.getKey())) {
					camelVarMap.put(header.getKey(), header.getValue());
				}
			}
			return camelVarMap;
		} else if ("bodyAndHeaders".equals(returnSpec)) {
			Map<String, Object> camelVarMap = new HashMap();
			if (camelBody instanceof Map<?, ?>) {
				Map<?, ?> camelBodyMap = (Map<?, ?>) camelBody;
				for (@SuppressWarnings("rawtypes")
				Map.Entry e : camelBodyMap.entrySet()) {
					if (e.getKey() instanceof String) {
						camelVarMap.put((String) e.getKey(), e.getValue());
					}
				}
			} else {
				camelVarMap.put("body", camelBody);
			}
			for (Map.Entry<String, Object> header : exchange.getIn().getHeaders().entrySet()) {
				if (returnHeaderList.size() == 0 || returnHeaderList.contains(header.getKey())) {
					camelVarMap.put(header.getKey(), header.getValue());
				}
			}
			return camelVarMap;
		}
		return null;
	}

	private ObjectNode buildResponse(final Object methodResult) {
		ObjectNode node = null;
		if( methodResult instanceof Map ){
			node = this.objectMapper.valueToTree(methodResult);
		}else{
			node = this.objectMapper.createObjectNode();
			node.putPOJO("result", methodResult);
		}
		return node;
	}

	private Map<String, Object> buildErrorResponse(final Exception exception) {
		final Map<String, Object> error = new HashMap<String, Object>(6);
		//error.put("origin", exception.getOrigin());
		//error.put("code", exception.getErrorCode());
		String cmessage = null;
		Throwable cause = exception.getCause();
		if (cause != null) {
			while (cause.getCause() != null) {
				cause = cause.getCause();
			}
			cmessage = cause.toString();
			if (cmessage == null) {
				cmessage = cause.toString();
			}
		}
		error.put("message", constructMessage(exception.getMessage(), cmessage));
		error.put("class", exception.getClass().getName());
		return error;
	}

	private String constructMessage(String m1, String m2) {
		if (m2 == null) {
			return m1;
		}
		if (m1 != null && !m1.endsWith(":")) {
			return m1 + ":" + m2;
		}
		return m1 + m2;
	}

	protected String getUserName() {
		return ThreadContext.getThreadContext().getUserName();
	}

	protected boolean isPermitted(String userName, List<String> userRoleList, List<String> permittedUserList, List<String> permittedRoleList) {
		if (permittedUserList.contains(userName)) {
			return true;
		}
		for (String userRole : userRoleList) {
			if (permittedRoleList.contains(userRole)) {
				return true;
			}
		}
		return false;
	}

	protected List<String> getUserRoles(String userName) {
		List<String> userRoleList = null;
		try {
			userRoleList = this.permissionService.getUserRoles(userName);
		} catch (Exception e) {
			userRoleList = new ArrayList<>();
		}
		return userRoleList;
	}

	protected Object getValue(String name, Object value, Object def, boolean optional, Class type) {
		if (value == null && def != null) {
			def = convertTo(def, type);
			value = def;
		}
		if (value == null && optional == false) {
			throw new RuntimeException("WampClientConsumer:Missing parameter:" + name);
		}
		if (value == null) {
			return null;
		}
		if (!type.isAssignableFrom(value.getClass())) {
			throw new RuntimeException("WampClientConsumer:parameter(" + name + ") wrong type:" + value.getClass() + " needed:" + type);
		}
		return value;
	}

	public static Object convertTo(Object sourceObject, Class<?> targetClass) {
		try {
			return ConvertUtils.convert(sourceObject, targetClass);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	protected int countBodyParams(List<Map> paramList) {
		int count = 0;
		for (Map param : paramList) {
			String destination = (String) param.get("destination");
			if ("body".equals(destination)) {
				count++;
			}
		}
		return count;
	}

	private <T> T getByType(CamelContext ctx, Class<T> kls) {
		return kls.cast(ctx.getRegistry().lookupByName(kls.getName()));
	}

	private boolean isEmpty(String s) {
		return (s == null || "".equals(s.trim()));
	}

	protected void doStart() throws Exception {
/* $if version >= 1.8 $
		if( !this.endpoint.getMode().equals("rpc") && !this.endpoint.getMode().equals("subscribe")){
			return;
		}
		super.doStart();
		this.clientSession = endpoint.createWampClientSession(org.ms123.common.wamp.WampServiceImpl.DEFAULT_REALM);
		info(this,"======Consumer.Start:" + this.clientSession);
		this.clientSession.statusChanged().subscribe((state) -> {
			info(this,"Consumer.ClientSession:status changed to " + state);
			if (state == WampClientSession.Status.Connected) {
				try {
					Thread.sleep(100);
				} catch (InterruptedException e) {
				}
				wampClientConnected();
			}
			if (state == WampClientSession.Status.Disconnected) {
			}
		}, (t) -> {
			debug(this,"Consumer.ClientSession ended with error " + t);
			t.printStackTrace();
		}, () -> {
			debug(this,"Consumer.ClientSession ended normally");
		});
$endif$ */
	}

	protected void doStop() throws Exception {
		String namespace = endpoint.getCamelContext().getName().split("/")[0];
		//debug(this,"######Consumer.Stop:" + namespace + "." + endpoint.getProcedure() + "/" + this.hashCode());
		this.clientSession.close();
		super.doStop();
	}
}

