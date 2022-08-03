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

import { reactive, h } from 'vue'
import { NButton, NIcon, NSpace, NTag, NTooltip, NEllipsis } from 'naive-ui'
import ButtonLink from '@/components/button-link'
import { useI18n } from 'vue-i18n'
import {
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  PlayCircleOutlined
} from '@vicons/antd'
import {
  queryTaskDefinitionListPaging,
  releaseTaskDefinition,
  startTaskDefinition
} from '@/service/modules/task-definition'
import { useRoute } from 'vue-router'
import {
  COLUMN_WIDTH_CONFIG,
  calculateTableWidth,
  DefaultTableWidth
} from '@/common/column-width-config'
import type {
  TaskDefinitionItem,
  TaskDefinitionRes
} from '@/service/modules/task-definition/types'
import type { IRecord } from './types'

export function useTable(onEdit: Function) {
  const { t } = useI18n()
  const route = useRoute()
  const projectCode = Number(route.params.projectCode)

  const createColumns = (variables: any) => {
    variables.columns = [
      {
        title: '#',
        key: 'index',
        render: (row: any, index: number) => index + 1,
        ...COLUMN_WIDTH_CONFIG['index']
      },
      {
        title: t('project.task.task_name'),
        key: 'taskName',
        ...COLUMN_WIDTH_CONFIG['linkName'],
        render: (row: IRecord) =>
          h(
            ButtonLink,
            {
              onClick: () => void onEdit(row, true)
            },
            {
              default: () =>
                h(
                  NEllipsis,
                  COLUMN_WIDTH_CONFIG['linkEllipsis'],
                  () => row.taskName
                )
            }
          )
      },
      {
        title: t('project.task.version'),
        key: 'taskVersion',
        render: (row: TaskDefinitionItem) =>
          h('span', null, 'v' + row.taskVersion),
        ...COLUMN_WIDTH_CONFIG['version']
      },
      {
        title: t('project.task.workflow_name'),
        key: 'processDefinitionName',
        ...COLUMN_WIDTH_CONFIG['name']
      },
      {
        title: t('project.task.task_type'),
        key: 'taskType',
        ...COLUMN_WIDTH_CONFIG['type']
      },
      {
        title: t('project.task.workflow_state'),
        key: 'processReleaseState',
        render: (row: any) => {
          if (row.processReleaseState === 'OFFLINE') {
            return h(NTag, { type: 'error', size: 'small' }, () =>
              t('project.task.offline')
            )
          } else if (row.processReleaseState === 'ONLINE') {
            return h(NTag, { type: 'info', size: 'small' }, () =>
              t('project.task.online')
            )
          }
        },
        width: 130
      },
      {
        title: t('project.task.create_time'),
        key: 'taskCreateTime',
        ...COLUMN_WIDTH_CONFIG['time']
      },
      {
        title: t('project.task.update_time'),
        key: 'taskUpdateTime',
        ...COLUMN_WIDTH_CONFIG['time']
      },
      {
        title: t('project.task.operation'),
        key: 'operation',
        ...COLUMN_WIDTH_CONFIG['operation'](3),
        render(row: any) {
          return h(NSpace, null, {
            default: () => [
              h(
                NTooltip,
                {},
                {
                  trigger: () =>
                    h(
                      NButton,
                      {
                        circle: true,
                        type: 'info',
                        size: 'small',
                        onClick: () => onRelease(row)
                      },
                      {
                        icon: () =>
                          h(NIcon, null, {
                            default: () =>
                              h(
                                row.processReleaseState === 'ONLINE'
                                  ? DownloadOutlined
                                  : UploadOutlined
                              )
                          })
                      }
                    ),
                  default: () => t('project.task.move')
                }
              ),
              h(
                NTooltip,
                {},
                {
                  trigger: () =>
                    h(
                      NButton,
                      {
                        circle: true,
                        type: 'info',
                        size: 'small',
                        onClick: () => onStart(row)
                      },
                      {
                        icon: () =>
                          h(NIcon, null, {
                            default: () => h(PlayCircleOutlined)
                          })
                      }
                    ),
                  default: () => t('project.task.version')
                }
              ),
              h(
                NTooltip,
                {},
                {
                  trigger: () =>
                    h(
                      NButton,
                      {
                        circle: true,
                        type: 'info',
                        size: 'small',
                        disabled:
                          ['CONDITIONS', 'SWITCH'].includes(row.taskType) ||
                          (!!row.processDefinitionCode &&
                            row.processReleaseState === 'ONLINE'),
                        onClick: () => onEdit(row, false)
                      },
                      {
                        icon: () =>
                          h(NIcon, null, { default: () => h(EditOutlined) })
                      }
                    ),
                  default: () => t('project.task.edit')
                }
              )
            ]
          })
        }
      }
    ]
    if (variables.tableWidth) {
      variables.tableWidth = calculateTableWidth(variables.columns)
    }
  }

  const variables = reactive({
    columns: [],
    tableWidth: DefaultTableWidth,
    tableData: [],
    page: 1,
    pageSize: 10,
    searchTaskName: null,
    searchWorkflowName: null,
    totalPage: 1,
    taskType: null,
    row: {},
    loading: false
  })

  const getTableData = (params: any) => {
    if (variables.loading) return
    variables.loading = true
    queryTaskDefinitionListPaging({ ...params }, { projectCode })
      .then((res: TaskDefinitionRes) => {
        variables.tableData = [...res.totalList] as any
        variables.totalPage = res.totalPage
      })
      .finally(() => {
        variables.loading = false
      })
  }

  const onRelease = (row: any) => {
    const data = {
      releaseState: (row.releaseState === 'ONLINE' ? 'OFFLINE' : 'ONLINE') as
        | 'OFFLINE'
        | 'ONLINE'
    }
    releaseTaskDefinition(data, projectCode, row.code).then(() => {
      window.$message.success(t('project.workflow.success'))
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchTaskName: variables.searchTaskName,
        searchWorkflowName: variables.searchWorkflowName,
        taskType: variables.taskType
      })
    })
  }

  const onStart = (row: any) => {
    startTaskDefinition(projectCode, row.code).then(() => {
      window.$message.success(t('project.workflow.success'))
      getTableData({
        pageSize: variables.pageSize,
        pageNo: variables.page,
        searchTaskName: variables.searchTaskName,
        searchWorkflowName: variables.searchWorkflowName,
        taskType: variables.taskType
      })
    })
  }

  return {
    variables,
    getTableData,
    createColumns
  }
}
