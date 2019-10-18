/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { IUiActionsSetup, IUiActionsApi } from 'src/plugins/ui_actions/public';
import {
  DataPublicPluginSetup,
  IEsSearchResponse,
  DataPublicPluginStart,
} from '../../../../../src/plugins/data/public';
import {
  Plugin,
  CoreSetup,
  PluginInitializerContext,
  CoreStart,
} from '../../../../../src/core/public';
import {
  CONTEXT_MENU_TRIGGER,
  IEmbeddableSetupContract,
  IEmbeddableStart,
} from '../../../../../src/plugins/embeddable/public';
import {
  createChangeQueryListenerAction,
  CHANGE_QUERY_LISTENER,
} from './actions/change_query_listener_action';
import {
  EQL_SEARCH_STRATEGY,
  IEqlSearchRequest,
  SQL_SEARCH_STRATEGY,
  ISqlSearchRequest,
  ISqlSearchResponse,
} from '../common';
import { eqlSearchStrategyProvider } from './search_strategies/eql_search_strategy';
import { sqlSearchStrategyProvider } from './search_strategies/sql_search_strategy';
import { EQL_SEARCH_EMBEDDABLE } from './embeddables/eql/eql_search_embeddable';
import { EqlSearchEmbeddableFactory } from './embeddables/eql/eql_search_embeddable_factory';
import { KQL_SEARCH_EMBEDDABLE } from './embeddables/kql/kql_search_embeddable';
import { KqlSearchEmbeddableFactory } from './embeddables/kql/kql_search_embeddable_factory';
import { SQL_SEARCH_EMBEDDABLE } from './embeddables/sql/sql_search_embeddable';
import { SqlSearchEmbeddableFactory } from './embeddables/sql/sql_search_embeddable_factory';

interface SetupDeps {
  data: DataPublicPluginSetup;
  uiActions: IUiActionsSetup;
  embeddable: IEmbeddableSetupContract;
}

interface StartDeps {
  data: DataPublicPluginStart;
  embeddable: IEmbeddableStart;
  uiActions: IUiActionsApi;
}

declare module '../../../../../src/plugins/data/public' {
  export interface IRequestTypesMap {
    [EQL_SEARCH_STRATEGY]: IEqlSearchRequest;
    [SQL_SEARCH_STRATEGY]: ISqlSearchRequest;
  }

  export interface IResponseTypesMap {
    [EQL_SEARCH_STRATEGY]: IEsSearchResponse;
    [SQL_SEARCH_STRATEGY]: ISqlSearchResponse;
  }
}

export class EqlSearchSpaceTime implements Plugin<void, void, SetupDeps, StartDeps> {
  constructor(private initializerContext: PluginInitializerContext) {}
  public setup(core: CoreSetup, deps: SetupDeps) {
    deps.data.search.registerSearchStrategyProvider(
      this.initializerContext.opaqueId,
      EQL_SEARCH_STRATEGY,
      eqlSearchStrategyProvider
    );

    deps.data.search.registerSearchStrategyProvider(
      this.initializerContext.opaqueId,
      SQL_SEARCH_STRATEGY,
      sqlSearchStrategyProvider
    );
  }

  public start(core: CoreStart, deps: StartDeps) {
    deps.uiActions.registerAction(createChangeQueryListenerAction(core.overlays.openModal));
    deps.uiActions.attachAction(CONTEXT_MENU_TRIGGER, CHANGE_QUERY_LISTENER);

    deps.embeddable.registerEmbeddableFactory(
      EQL_SEARCH_EMBEDDABLE,
      new EqlSearchEmbeddableFactory(deps.data.search.search)
    );

    deps.embeddable.registerEmbeddableFactory(
      KQL_SEARCH_EMBEDDABLE,
      new KqlSearchEmbeddableFactory(deps.data.search.search)
    );

    deps.embeddable.registerEmbeddableFactory(
      SQL_SEARCH_EMBEDDABLE,
      new SqlSearchEmbeddableFactory(deps.data.search.search)
    );
  }

  public stop() {}
}
