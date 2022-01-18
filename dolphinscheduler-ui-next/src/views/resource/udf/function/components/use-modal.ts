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

import _ from 'lodash'
import { reactive, SetupContext } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  createUdfFunc,
  queryResourceList,
  updateUdfFunc
} from '@/service/modules/resources'
import { useAsyncState } from '@vueuse/core'

export function useModal(
  state: any,
  ctx: SetupContext<('update:show' | 'updateList')[]>
) {
  const { t } = useI18n()

  const handleCreateFunc = async () => {
    submitRequest(
      async () =>
        await createUdfFunc(
          {
            ...state.functionForm
          },
          state.functionForm.resourceId
        )
    )
  }

  const handleRenameFunc = async (id: number) => {
    submitRequest(async () => {
      await updateUdfFunc(
        {
          ...state.functionForm,
          id
        },
        state.functionForm.resourceId,
        id
      )
    })
  }

  const submitRequest = (serviceHandle: any) => {
    state.functionFormRef.validate(async (valid: any) => {
      if (!valid) {
        try {
          await serviceHandle()
          window.$message.success(t('resource.udf.success'))
          ctx.emit('updateList')
          ctx.emit('update:show')
        } catch (error: any) {
          window.$message.error(error.message)
        }
      }
    })
  }

  const variables = reactive({
    udfResourceList: [],
    udfResourceDirList: []
  })

  const filterEmptyDirectory = (list: any) => {
    for (const item of list) {
      if (item.children) {
        filterEmptyDirectory(item.children)
      }
    }
    return list.filter(
      (n: any) =>
        (/\.jar$/.test(n.name) && n.children.length === 0) ||
        (!/\.jar$/.test(n.name) && n.children.length > 0)
    )
  }

  // filterJarFile
  const filterJarFile = (array: any) => {
    for (const item of array) {
      if (item.children) {
        item.children = filterJarFile(item.children)
      }
    }
    return array.filter((n: any) => !/\.jar$/.test(n.name))
  }

  // diGuiTree
  const diGuiTree = (item: any) => {
    // Recursive convenience tree structure
    item.forEach((item: any) => {
      item.children === '' ||
      item.children === undefined ||
      item.children === null ||
      item.children.length === 0
        ? delete item.children
        : diGuiTree(item.children)
    })
  }

  const getUdfList = () => {
    const { state } = useAsyncState(
      queryResourceList({ type: 'UDF' }).then((res: any) => {
        let item = res
        filterEmptyDirectory(item)
        item = filterEmptyDirectory(item)
        let item1 = _.cloneDeep(res)
        diGuiTree(item)

        diGuiTree(filterJarFile(item1))
        item1 = item1.filter((item: any) => {
          if (item.directory) {
            return item
          }
        })
        variables.udfResourceList = item
        variables.udfResourceDirList = item1
      }),
      {}
    )
    return state
  }

  return {
    variables,
    getUdfList,
    handleCreateFunc,
    handleRenameFunc
  }
}
