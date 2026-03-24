/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Datasource type list shared between the create form and the list view.
 * value: the actual type stored in backend.
 * label: the display name shown to users.
 */
export const DATASOURCE_TYPE_LIST = [
  { value: 'MYSQL', label: 'MYSQL' },
  { value: 'POSTGRESQL', label: '星环TDH' },
  { value: 'HIVE', label: 'HOceanBase' },
  { value: 'SPARK', label: 'Greenplum' },
  { value: 'CLICKHOUSE', label: 'CLICKHOUSE' },
  { value: 'ORACLE', label: 'ORACLE' },
  { value: 'SQLSERVER', label: 'SQLSERVER' },
  { value: 'DB2', label: 'DB2' },
  { value: 'PRESTO', label: 'PRESTO' }
]

/** Map of value → label for fast lookup */
export const DATASOURCE_TYPE_MAP = DATASOURCE_TYPE_LIST.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})
