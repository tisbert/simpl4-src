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
package org.ms123.common.domainobjects.api;

import java.util.Map;
import java.util.List;
import org.ms123.common.store.StoreDesc;
import javax.jdo.PersistenceManager;

public interface DomainObjectsService {

	public final String ENTITY = "entity";

	public final String FIELD = "field";

	public final String RELATION = "relation";

	public void createClasses(StoreDesc sdesc) throws Exception;
	public ClassLoader getClassLoader( StoreDesc sdesc);

	//public void createClasses(StoreDesc sdesc, List<Map> entities) throws Exception;
}
